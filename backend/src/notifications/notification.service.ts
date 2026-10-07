import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import nodemailer, { type Transporter } from 'nodemailer';

const RETENTION_MONTHS = 12;
const OUTBOX_RETENTION_DAYS = 30;
const MAX_ATTEMPTS = 12;

function retentionDate(date: Date) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + RETENTION_MONTHS);
  return result;
}

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private readonly transporter: Transporter | null;
  private timer: NodeJS.Timeout | undefined;
  private running = false;
  private missingSmtpWarningLogged = false;

  constructor(private readonly prisma: PrismaService) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT ?? 587);
    if (host && user && pass && Number.isInteger(port) && port > 0) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true',
        connectionTimeout: 30_000,
        greetingTimeout: 30_000,
        socketTimeout: 120_000,
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
      if (process.env.NODE_ENV === 'production') {
        throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_PORT are required in production.');
      }
    }
  }

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.runMaintenance();
    }, 15_000);
    this.timer.unref();
    void this.runMaintenance();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async enqueue(
    recipient: string,
    subject: string,
    text: string,
    appointmentId?: string,
    transaction?: Prisma.TransactionClient,
  ) {
    const client = transaction ?? this.prisma;
    await client.notificationOutbox.create({
      data: {
        recipient,
        subject,
        text,
        ...(appointmentId ? { appointmentId } : {}),
      },
    });
  }

  private async runMaintenance() {
    if (this.running) return;
    this.running = true;
    try {
      await this.processOne();
      await this.closePastAppointments();
      await this.anonymizeExpiredAppointments();
      await this.pruneOutbox();
    } catch (error) {
      this.logger.error(
        'Background notification or retention task failed.',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }

  private async processOne() {
    if (!this.transporter) {
      if (!this.missingSmtpWarningLogged) {
        this.logger.warn('SMTP is not configured; notification emails remain queued.');
        this.missingSmtpWarningLogged = true;
      }
      return;
    }

    const now = new Date();
    const message = await this.prisma.notificationOutbox.findFirst({
      where: {
        status: { in: ['PENDING', 'SENDING'] },
        attempts: { lt: MAX_ATTEMPTS },
        nextAttemptAt: { lte: now },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!message) return;
    const claimed = await this.prisma.notificationOutbox.updateMany({
      where: {
        id: message.id,
        status: message.status,
        attempts: { lt: MAX_ATTEMPTS },
        nextAttemptAt: { lte: now },
      },
      data: {
        status: 'SENDING',
        nextAttemptAt: new Date(now.getTime() + 5 * 60_000),
      },
    });
    if (!claimed.count) return;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: message.recipient,
        subject: message.subject,
        text: message.text,
      });
      await this.prisma.notificationOutbox.update({
        where: { id: message.id },
        data: { status: 'SENT', sentAt: new Date(), lastError: null },
      });
    } catch (error) {
      const attempts = message.attempts + 1;
      const delaySeconds = Math.min(3600, 30 * 2 ** Math.min(attempts, 7));
      await this.prisma.notificationOutbox.update({
        where: { id: message.id },
        data: {
          status: 'PENDING',
          attempts,
          nextAttemptAt: new Date(Date.now() + delaySeconds * 1000),
          lastError: error instanceof Error ? error.message.slice(0, 1000) : 'SMTP delivery failed',
        },
      });
      this.logger.error(
        `Email delivery attempt ${attempts} failed for notification ${message.id}.`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async anonymizeExpiredAppointments() {
    const cutoff = new Date();
    cutoff.setUTCMonth(cutoff.getUTCMonth() - RETENTION_MONTHS);
    await this.prisma.appointment.updateMany({
      where: {
        status: { in: ['DECLINED', 'CANCELLED', 'COMPLETED'] },
        closedAt: { lt: cutoff },
        anonymizedAt: null,
      },
      data: {
        patientName: 'Patient anonymisé',
        patientEmail: 'supprime@radoko.invalid',
        patientPhone: '',
        reason: null,
        cancellationTokenHash: null,
        cancellationExpiresAt: null,
        patientPrivacyTokenHash: null,
        patientPrivacyTokenExpiresAt: null,
        anonymizedAt: new Date(),
      },
    });
  }

  private async pruneOutbox() {
    const cutoff = new Date(Date.now() - OUTBOX_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.notificationOutbox.deleteMany({
      where: {
        OR: [
          { status: 'SENT', sentAt: { lt: cutoff } },
          { status: { in: ['PENDING', 'SENDING'] }, attempts: { gte: MAX_ATTEMPTS } },
          { status: { in: ['PENDING', 'SENDING'] }, createdAt: { lt: cutoff } },
        ],
      },
    });
  }

  private async closePastAppointments() {
    const now = new Date();
    const pastAppointments = await this.prisma.appointment.findMany({
      where: {
        status: { in: ['REQUESTED', 'CONFIRMED'] },
        startsAt: { lt: now },
        closedAt: null,
      },
      select: { id: true, startsAt: true, durationMinutes: true, status: true },
    });
    for (const appointment of pastAppointments) {
      if (appointment.startsAt.getTime() + appointment.durationMinutes * 60_000 > now.getTime()) continue;
      await this.prisma.appointment.updateMany({
        where: { id: appointment.id, status: appointment.status, closedAt: null },
        data: {
          status: appointment.status === 'CONFIRMED' ? 'COMPLETED' : 'DECLINED',
          closedAt: now,
          patientPrivacyTokenExpiresAt: retentionDate(now),
        },
      });
    }
  }
}
