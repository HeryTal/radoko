import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto.js';
import { NotificationService } from '../notifications/notification.service.js';

const profileSelect = {
  id: true,
  email: true,
  name: true,
  professionalType: true,
  professionalTitle: true,
  specialty: true,
  practiceCity: true,
  practiceAddress: true,
  phone: true,
  profilePhotoUrl: true,
  spokenLanguages: true,
  bio: true,
  experienceYears: true,
  services: true,
  consultationFee: true,
  consultationModes: true,
  consultationDurationMinutes: true,
  isVerified: true,
  role: true,
  verificationNote: true,
  verificationStatus: true,
  createdAt: true,
  availabilities: {
    orderBy: [{ weekday: 'asc' as const }, { startTime: 'asc' as const }],
    select: { id: true, weekday: true, startTime: true, endTime: true },
  },
};

const publicProfileSelect = {
  id: true,
  name: true,
  professionalType: true,
  professionalTitle: true,
  specialty: true,
  practiceCity: true,
  practiceAddress: true,
  phone: true,
  profilePhotoUrl: true,
  spokenLanguages: true,
  bio: true,
  experienceYears: true,
  services: true,
  consultationFee: true,
  consultationModes: true,
  consultationDurationMinutes: true,
  isVerified: true,
  availabilities: {
    orderBy: [{ weekday: 'asc' as const }, { startTime: 'asc' as const }],
    select: { weekday: true, startTime: true, endTime: true },
  },
};

const madagascarWeekday = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Africa/Nairobi',
  weekday: 'short',
});

const madagascarTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Nairobi',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const madagascarDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Nairobi',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function getMadagascarDate(date: Date) {
  const parts = Object.fromEntries(
    madagascarDate
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function retentionExpiration(date: Date) {
  const expiration = new Date(date);
  expiration.setUTCMonth(expiration.getUTCMonth() + 12);
  return expiration;
}

async function acquireDoctorLock(
  transaction: Prisma.TransactionClient,
  doctorId: string,
) {
  await transaction.$queryRaw`
    WITH advisory_lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(hashtext(${doctorId}))
    )
    SELECT 1 FROM advisory_lock
  `;
}

const weekdayNumbers: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const logger = new Logger('DoctorProfilePhoto');
const photoDirectory = resolve(
  process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads'),
);

function photoExtension(file: Express.Multer.File) {
  const { buffer } = file;
  if (
    file.mimetype === 'image/jpeg' &&
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpg';
  }
  if (
    file.mimetype === 'image/png' &&
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return 'png';
  }
  if (
    file.mimetype === 'image/webp' &&
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  throw new BadRequestException('Le fichier choisi n’est pas une image JPG, PNG ou WebP valide.');
}

function managedPhotoPath(photoUrl: string | null | undefined) {
  const match = photoUrl?.match(/^\/uploads\/([a-f0-9-]+\.(?:jpg|png|webp))$/i);
  return match ? join(photoDirectory, match[1]) : null;
}

async function removeManagedPhoto(photoUrl: string | null | undefined) {
  const photoPath = managedPhotoPath(photoUrl);
  if (!photoPath) return;

  try {
    await unlink(photoPath);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return;
    }
    throw error;
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notifications: NotificationService,
  ) {}

  async register({
    email,
    password,
    name,
    professionalType,
    specialty,
    practiceCity,
    phone,
  }: RegisterDto) {
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    try {
      return await this.prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          passwordHash,
          ...(name === undefined ? {} : { name }),
          ...(professionalType === undefined ? {} : { professionalType }),
          ...(specialty === undefined ? {} : { specialty }),
          ...(practiceCity === undefined ? {} : { practiceCity }),
          ...(phone === undefined ? {} : { phone }),
        },
        select: {
          ...profileSelect,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
      }

      throw error;
    }
  }

  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('E-mail ou mot de passe invalide.');
    }

    return {
      accessToken: await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      }),
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });

    if (!user) {
      throw new NotFoundException('Compte introuvable.');
    }

    return user;
  }

  async updateProfile(userId: string, input: UpdateDoctorProfileDto) {
    const data: Prisma.UserUpdateInput = {};
    let requiresReverification = false;
    const clean = (value: string | null | undefined) =>
      typeof value === 'string' && value.trim() === '' ? null : value;

    if (input.name !== undefined) data.name = clean(input.name);
    if (input.professionalType !== undefined) {
      data.professionalType = input.professionalType;
    }
    if (input.professionalTitle !== undefined) {
      data.professionalTitle = clean(input.professionalTitle);
    }
    if (input.specialty !== undefined) data.specialty = clean(input.specialty);
    if (input.practiceCity !== undefined) {
      data.practiceCity = clean(input.practiceCity);
    }
    if (input.practiceAddress !== undefined) {
      data.practiceAddress = clean(input.practiceAddress);
    }
    if (input.phone !== undefined) data.phone = clean(input.phone);
    if (input.spokenLanguages !== undefined) {
      data.spokenLanguages = input.spokenLanguages;
    }
    if (input.bio !== undefined) data.bio = clean(input.bio);
    if (input.experienceYears !== undefined) {
      data.experienceYears = input.experienceYears;
    }
    if (input.services !== undefined) data.services = input.services;
    if (input.consultationFee !== undefined) {
      data.consultationFee = input.consultationFee;
    }
    if (input.consultationModes !== undefined) {
      data.consultationModes = input.consultationModes;
    }
    if (input.consultationDurationMinutes !== undefined) {
      data.consultationDurationMinutes = input.consultationDurationMinutes;
    }
    if (input.specialty !== undefined || input.professionalType !== undefined) {
      const current = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { specialty: true, professionalType: true },
      });
      if (!current) throw new NotFoundException('Compte introuvable.');
      if (
        (input.specialty !== undefined &&
          (clean(input.specialty) ?? null) !== current.specialty) ||
        (input.professionalType !== undefined &&
          input.professionalType !== current.professionalType)
      ) {
        data.isVerified = false;
        data.verificationStatus = 'PENDING';
        data.verificationNote = null;
        requiresReverification = true;
      }
    }

    return this.prisma.$transaction(async (transaction) => {
      if (requiresReverification) {
        await transaction.verificationDocument.deleteMany({ where: { doctorId: userId } });
      }
      return transaction.user.update({
        where: { id: userId },
        data,
        select: profileSelect,
      });
    });
  }


  async updateProfilePhoto(userId: string, file: Express.Multer.File) {
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('La photo ne peut pas dépasser 5 Mo.');
    }
    const extension = photoExtension(file);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhotoUrl: true },
    });
    if (!user) throw new NotFoundException('Compte introuvable.');

    const filename = `${randomUUID()}.${extension}`;
    const destination = join(photoDirectory, filename);
    await mkdir(photoDirectory, { recursive: true });
    await writeFile(destination, file.buffer, { flag: 'wx' });

    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { profilePhotoUrl: `/uploads/${filename}` },
        select: profileSelect,
      });
      try {
        await removeManagedPhoto(user.profilePhotoUrl);
      } catch (error) {
        logger.error(
          `Could not remove replaced profile photo for user ${userId}.`,
          error instanceof Error ? error.stack : String(error),
        );
      }
      return updated;
    } catch (error) {
      try {
        await unlink(destination);
      } catch (cleanupError) {
        logger.error(
          `Could not remove failed profile photo upload for user ${userId}.`,
          cleanupError instanceof Error
            ? cleanupError.stack
            : String(cleanupError),
        );
      }
      throw error;
    }
  }

  async uploadVerificationDocument(userId: string, file: Express.Multer.File) {
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Le justificatif ne peut pas dépasser 10 Mo.');
    }
    const validPdf = file.mimetype === 'application/pdf' &&
      file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    const validJpeg = file.mimetype === 'image/jpeg' &&
      file.buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    const validPng = file.mimetype === 'image/png' &&
      file.buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (!validPdf && !validJpeg && !validPng) {
      throw new BadRequestException('Le justificatif doit être un PDF, JPG ou PNG valide.');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!currentUser || currentUser.role !== 'PROFESSIONAL') {
      throw new NotFoundException('Compte professionnel introuvable.');
    }
    const fileName = file.originalname.replace(/[^\w.-]/g, '_').slice(0, 150) || 'justificatif';
    const document = await this.prisma.$transaction(async (transaction) => {
      await transaction.verificationDocument.deleteMany({ where: { doctorId: userId } });
      await transaction.user.update({
        where: { id: userId },
        data: {
          isVerified: false,
          verificationStatus: 'PENDING',
          verificationNote: null,
        },
      });
      return transaction.verificationDocument.create({
        data: {
          doctorId: userId,
          fileName,
          mimeType: file.mimetype,
          content: Uint8Array.from(file.buffer),
        },
        select: { id: true, fileName: true, mimeType: true, createdAt: true },
      });
    });
    return { document, profile: await this.getProfile(userId) };
  }

  async removeProfilePhoto(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhotoUrl: true },
    });
    if (!user) throw new NotFoundException('Compte introuvable.');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhotoUrl: null },
      select: profileSelect,
    });
    try {
      await removeManagedPhoto(user.profilePhotoUrl);
    } catch (error) {
      logger.error(
        `Could not remove profile photo for user ${userId}.`,
        error instanceof Error ? error.stack : String(error),
      );
    }
    return updated;
  }

  async updateAvailability(userId: string, input: UpdateAvailabilityDto) {
    const windows = [...input.windows].sort(
      (first, second) =>
        first.weekday - second.weekday ||
        first.startTime.localeCompare(second.startTime),
    );

    for (let index = 0; index < windows.length; index += 1) {
      const window = windows[index];
      if (window.startTime >= window.endTime) {
        throw new BadRequestException(
          'L’heure de fin doit être postérieure à l’heure de début.',
        );
      }

      const previous = windows[index - 1];
      if (
        previous?.weekday === window.weekday &&
        previous.endTime > window.startTime
      ) {
        throw new BadRequestException(
          'Les horaires de disponibilité ne peuvent pas se chevaucher.',
        );
      }
    }

    await this.prisma.$transaction(async (transaction) => {
      await acquireDoctorLock(transaction, userId);
      await transaction.availability.deleteMany({ where: { doctorId: userId } });
      if (windows.length) {
        await transaction.availability.createMany({
          data: windows.map((window) => ({ ...window, doctorId: userId })),
        });
      }
    });

    return this.getProfile(userId);
  }

  async getPublicProfile(doctorId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId, role: 'PROFESSIONAL', isVerified: true },
      select: publicProfileSelect,
    });

    if (!doctor) throw new NotFoundException('Profil médecin introuvable.');

    return doctor;
  }

  async searchPublicProfiles(specialty?: string, city?: string) {
    return this.prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL',
        isVerified: true,
        ...(specialty
          ? {
              OR: [
                { specialty: { contains: specialty, mode: 'insensitive' as const } },
                { professionalType: { contains: specialty, mode: 'insensitive' as const } },
              ],
            }
          : {}),
        ...(city ? { practiceCity: { contains: city, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
      take: 100,
      select: {
        id: true,
        name: true,
        professionalType: true,
        professionalTitle: true,
        specialty: true,
        practiceCity: true,
        practiceAddress: true,
        profilePhotoUrl: true,
        isVerified: true,
      },
    });
  }

  async getPublicBookedSlots(doctorId: string, date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('La date demandée est invalide.');
    }
    const startsAt = new Date(`${date}T00:00:00+03:00`);
    if (
      !Number.isFinite(startsAt.getTime()) ||
      getMadagascarDate(startsAt) !== date
    ) {
      throw new BadRequestException('La date demandée est invalide.');
    }
    const endsAt = new Date(startsAt.getTime() + 24 * 60 * 60 * 1000);
    const doctorExists = await this.prisma.user.findUnique({
      where: { id: doctorId, role: 'PROFESSIONAL', isVerified: true },
      select: { id: true },
    });
    if (!doctorExists) throw new NotFoundException('Profil médecin introuvable.');

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
        startsAt: { gte: new Date(startsAt.getTime() - 24 * 60 * 60_000), lt: endsAt },
      },
      select: { startsAt: true, durationMinutes: true },
    });
    return appointments.map((appointment) => ({
      startsAt: appointment.startsAt,
      durationMinutes: appointment.durationMinutes,
    }));
  }

  async getAppointments(doctorId: string) {
    const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        OR: [
          { startsAt: { gte: new Date() } },
          { startsAt: { gte: recentCutoff }, status: { in: ['COMPLETED', 'CANCELLED', 'DECLINED'] } },
        ],
      },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        startsAt: true,
        durationMinutes: true,
        patientName: true,
        patientEmail: true,
        patientPhone: true,
        reason: true,
        status: true,
      },
    });
  }

  async createAppointment(doctorId: string, input: CreateAppointmentDto) {
    if (!input.privacyConsent) {
      throw new BadRequestException('Votre accord sur le traitement des données est requis.');
    }
    const startsAt = new Date(input.startsAt);
    if (!Number.isFinite(startsAt.getTime()) || startsAt <= new Date()) {
      throw new BadRequestException('Choisissez un créneau futur.');
    }

    const cancellationToken = randomBytes(32).toString('base64url');
    const privacyToken = randomBytes(32).toString('base64url');
    const appointment = await this.prisma.$transaction(async (transaction) => {
      await acquireDoctorLock(transaction, doctorId);
      const doctor = await transaction.user.findFirst({
        where: { id: doctorId, role: 'PROFESSIONAL', isVerified: true },
        select: {
          id: true,
          email: true,
          consultationDurationMinutes: true,
          availabilities: { select: { weekday: true, startTime: true, endTime: true } },
        },
      });
      if (!doctor) throw new NotFoundException('Profil professionnel introuvable ou non vérifié.');
      this.assertSlotFits(doctor, startsAt);
      await this.assertNoOverlap(transaction, doctorId, startsAt, doctor.consultationDurationMinutes);
      const created = await transaction.appointment.create({
        data: {
          doctorId,
          startsAt,
          durationMinutes: doctor.consultationDurationMinutes,
          patientName: input.patientName,
          patientEmail: input.patientEmail.toLowerCase(),
          patientPhone: input.patientPhone,
          privacyConsentAt: new Date(),
          cancellationTokenHash: this.hashCancellationToken(cancellationToken),
          cancellationExpiresAt: startsAt,
          patientPrivacyTokenHash: this.hashCancellationToken(privacyToken),
          patientPrivacyTokenExpiresAt: retentionExpiration(startsAt),
          ...(input.reason ? { reason: input.reason } : {}),
        },
        select: {
          id: true,
          startsAt: true,
          durationMinutes: true,
          patientName: true,
          patientEmail: true,
        },
      });
      const time = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Africa/Nairobi',
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(created.startsAt);
      const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3001').split(',')[0].trim();
      const cancellationUrl = `${frontendUrl}/rendez-vous/annuler?token=${encodeURIComponent(cancellationToken)}`;
      const privacyUrl = `${frontendUrl}/mes-donnees?token=${encodeURIComponent(privacyToken)}`;
      await this.notifications.enqueue(
        doctor.email,
        'Nouvelle demande de rendez-vous sur Radoko',
        `Une demande de rendez-vous a été reçue pour le ${time}.\nPatient : ${created.patientName}\nContact : ${created.patientEmail}\n\nConnectez-vous à votre espace professionnel pour confirmer ou refuser.`,
        created.id,
        transaction,
      );
      await this.notifications.enqueue(
        created.patientEmail,
        'Demande de rendez-vous reçue par Radoko',
        `Votre demande de rendez-vous pour le ${time} a été transmise au professionnel. Elle sera confirmée après validation.\n\nPour annuler cette demande avant le rendez-vous : ${cancellationUrl}\nPour demander l’effacement immédiat de vos coordonnées associées à votre adresse e-mail : ${privacyUrl}`,
        created.id,
        transaction,
      );
      return created;
    });
    return {
      id: appointment.id,
      startsAt: appointment.startsAt,
      durationMinutes: appointment.durationMinutes,
      status: 'REQUESTED' as const,
    };
  }

  async updateAppointmentStatus(doctorId: string, appointmentId: string, status: 'CONFIRMED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED') {
    return this.prisma.$transaction(async (transaction) => {
      const appointment = await transaction.appointment.findFirst({
        where: { id: appointmentId, doctorId },
      });
      if (!appointment) throw new NotFoundException('Rendez-vous introuvable.');
      const now = new Date();
      const valid =
        (appointment.status === 'REQUESTED' &&
          ((status === 'CONFIRMED' && appointment.startsAt > now) ||
            status === 'DECLINED' ||
            status === 'CANCELLED')) ||
        (appointment.status === 'CONFIRMED' &&
          ((status === 'CANCELLED' && appointment.startsAt > now) ||
            (status === 'COMPLETED' &&
              appointment.startsAt.getTime() + appointment.durationMinutes * 60_000 <= now.getTime())));
      if (!valid) throw new BadRequestException('Cette transition de statut n’est pas autorisée.');
      const update = await transaction.appointment.updateMany({
        where: { id: appointmentId, doctorId, status: appointment.status },
        data: {
          status,
          ...(['DECLINED', 'CANCELLED', 'COMPLETED'].includes(status)
            ? {
                closedAt: now,
                cancellationTokenHash: null,
                cancellationExpiresAt: null,
                patientPrivacyTokenExpiresAt: retentionExpiration(now),
              }
            : {}),
        },
      });
      if (!update.count) throw new ConflictException('Le statut du rendez-vous a changé. Actualisez la page.');
      await this.notifications.enqueue(
        appointment.patientEmail,
        'Mise à jour de votre rendez-vous Radoko',
        `Le statut de votre rendez-vous du ${new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Nairobi', dateStyle: 'full', timeStyle: 'short' }).format(appointment.startsAt)} est maintenant : ${statusLabel(status)}.`,
        appointmentId,
        transaction,
      );
      return { id: appointmentId, status, startsAt: appointment.startsAt };
    });
  }

  async rescheduleAppointment(doctorId: string, appointmentId: string, startsAtInput: string) {
    const startsAt = new Date(startsAtInput);
    if (!Number.isFinite(startsAt.getTime()) || startsAt <= new Date()) {
      throw new BadRequestException('Choisissez un créneau futur.');
    }
    const updated = await this.prisma.$transaction(async (transaction) => {
      await acquireDoctorLock(transaction, doctorId);
      const appointment = await transaction.appointment.findFirst({
        where: { id: appointmentId, doctorId, status: { in: ['REQUESTED', 'CONFIRMED'] }, startsAt: { gt: new Date() } },
        include: { doctor: { select: { email: true, consultationDurationMinutes: true, availabilities: { select: { weekday: true, startTime: true, endTime: true } } } } },
      });
      if (!appointment) throw new NotFoundException('Rendez-vous modifiable introuvable.');
      this.assertSlotFits(appointment.doctor, startsAt);
      await this.assertNoOverlap(transaction, doctorId, startsAt, appointment.doctor.consultationDurationMinutes, appointmentId);
      const updated = await transaction.appointment.update({
        where: { id: appointmentId },
        data: {
          startsAt,
          durationMinutes: appointment.doctor.consultationDurationMinutes,
          cancellationExpiresAt: startsAt,
          patientPrivacyTokenExpiresAt: retentionExpiration(startsAt),
        },
        select: { id: true, startsAt: true, status: true, patientEmail: true, patientName: true, durationMinutes: true },
      });
      await this.notifications.enqueue(
        updated.patientEmail,
        'Votre rendez-vous Radoko a été reprogrammé',
        `Votre rendez-vous a été déplacé au ${new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Nairobi', dateStyle: 'full', timeStyle: 'short' }).format(updated.startsAt)}.`,
        appointmentId,
        transaction,
      );
      return updated;
    });
    return { id: updated.id, startsAt: updated.startsAt, status: updated.status, durationMinutes: updated.durationMinutes };
  }

  async cancelAppointmentWithToken(token: string) {
    return this.prisma.$transaction(async (transaction) => {
      const tokenHash = this.hashCancellationToken(token);
      const appointment = await transaction.appointment.findUnique({
        where: { cancellationTokenHash: tokenHash },
        include: { doctor: { select: { email: true } } },
      });
      const now = new Date();
      if (
        !appointment ||
        !appointment.cancellationExpiresAt ||
        appointment.cancellationExpiresAt <= now ||
        appointment.startsAt <= now ||
        !['REQUESTED', 'CONFIRMED'].includes(appointment.status)
      ) {
        throw new NotFoundException('Ce lien d’annulation est invalide ou expiré.');
      }
      const cancelled = await transaction.appointment.updateMany({
        where: {
          id: appointment.id,
          cancellationTokenHash: tokenHash,
          cancellationExpiresAt: { gt: now },
          startsAt: { gt: now },
          status: { in: ['REQUESTED', 'CONFIRMED'] },
        },
        data: {
          status: 'CANCELLED',
          cancellationTokenHash: null,
          cancellationExpiresAt: null,
          patientPrivacyTokenExpiresAt: retentionExpiration(now),
          closedAt: now,
        },
      });
      if (!cancelled.count) throw new ConflictException('Ce rendez-vous a déjà été modifié.');
      await this.notifications.enqueue(
        appointment.doctor.email,
        'Un rendez-vous Radoko a été annulé',
        `Le rendez-vous prévu le ${new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Nairobi', dateStyle: 'full', timeStyle: 'short' }).format(appointment.startsAt)} a été annulé par le patient.`,
        appointment.id,
        transaction,
      );
      return { id: appointment.id, status: 'CANCELLED' as const };
    });
  }

  async deleteMyAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true, profilePhotoUrl: true },
    });
    if (!user) throw new NotFoundException('Compte introuvable.');
    if (user.role === 'ADMIN') throw new BadRequestException('Un compte administrateur ne peut pas être supprimé depuis cet espace.');
    await this.prisma.$transaction(async (transaction) => {
      const associatedAppointments = await transaction.appointment.findMany({
        where: { OR: [{ doctorId: userId }, { patientEmail: user.email }] },
        select: { id: true },
      });
      const appointmentIds = associatedAppointments.map(({ id }) => id);
      await transaction.notificationOutbox.deleteMany({
        where: {
          OR: [
            { recipient: user.email },
            ...(appointmentIds.length ? [{ appointmentId: { in: appointmentIds } }] : []),
          ],
        },
      });
      await transaction.appointment.updateMany({
        where: { patientEmail: user.email },
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
          closedAt: new Date(),
          status: 'CANCELLED',
        },
      });
      await transaction.user.delete({ where: { id: userId } });
    });
    await removeManagedPhoto(user.profilePhotoUrl);
    return { deleted: true };
  }

  async erasePatientDataWithToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { patientPrivacyTokenHash: this.hashCancellationToken(token) },
      select: {
        id: true,
        patientEmail: true,
        patientPrivacyTokenExpiresAt: true,
      },
    });
    if (
      !appointment ||
      !appointment.patientPrivacyTokenExpiresAt ||
      appointment.patientPrivacyTokenExpiresAt <= new Date() ||
      appointment.patientEmail === 'supprime@radoko.invalid'
    ) {
      throw new NotFoundException('Ce lien de confidentialité est invalide ou expiré.');
    }
    const email = appointment.patientEmail;
    const anonymizedAt = new Date();
    const result = await this.prisma.$transaction(async (transaction) => {
      const matching = await transaction.appointment.findMany({
        where: { patientEmail: email },
        select: { id: true },
      });
      const ids = matching.map(({ id }) => id);
      await transaction.appointment.updateMany({
        where: { patientEmail: email, status: { in: ['REQUESTED', 'CONFIRMED'] } },
        data: { status: 'CANCELLED', closedAt: anonymizedAt },
      });
      await transaction.appointment.updateMany({
        where: { patientEmail: email },
        data: {
          patientName: 'Patient anonymisé',
          patientEmail: 'supprime@radoko.invalid',
          patientPhone: '',
          reason: null,
          cancellationTokenHash: null,
          cancellationExpiresAt: null,
          patientPrivacyTokenHash: null,
          patientPrivacyTokenExpiresAt: null,
          anonymizedAt,
        },
      });
      await transaction.notificationOutbox.deleteMany({
        where: {
          OR: [
            { recipient: email },
            ...(ids.length ? [{ appointmentId: { in: ids } }] : []),
          ],
        },
      });
      return ids.length;
    });
    return { erased: true, appointmentsAnonymized: result };
  }

  private assertSlotFits(
    doctor: { consultationDurationMinutes: number; availabilities: Array<{ weekday: number; startTime: string; endTime: string }> },
    startsAt: Date,
  ) {
    if (!doctor.availabilities.length) {
      throw new BadRequestException('Ce professionnel n’a pas encore ouvert de créneau.');
    }
    const weekday = weekdayNumbers[madagascarWeekday.format(startsAt)];
    const localTime = madagascarTime.format(startsAt);
    const [hour, minute] = localTime.split(':').map(Number);
    const minuteOfDay = hour * 60 + minute;
    const validWindow = doctor.availabilities.some((window) => {
      if (window.weekday !== weekday || localTime < window.startTime) return false;
      const [startHour, startMinute] = window.startTime.split(':').map(Number);
      const [endHour, endMinute] = window.endTime.split(':').map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;
      return minuteOfDay + doctor.consultationDurationMinutes <= end &&
        (minuteOfDay - start) % doctor.consultationDurationMinutes === 0;
    });
    if (!validWindow) throw new BadRequestException('Ce créneau n’est pas disponible.');
  }

  private async assertNoOverlap(
    transaction: Prisma.TransactionClient,
    doctorId: string,
    startsAt: Date,
    durationMinutes: number,
    excludedAppointmentId?: string,
  ) {
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
    const possibleOverlaps = await transaction.appointment.findMany({
      where: {
        doctorId,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
        ...(excludedAppointmentId ? { id: { not: excludedAppointmentId } } : {}),
        startsAt: { lt: endsAt, gte: new Date(startsAt.getTime() - 24 * 60 * 60_000) },
      },
      select: { startsAt: true, durationMinutes: true },
    });
    if (possibleOverlaps.some((appointment) =>
      appointment.startsAt.getTime() + appointment.durationMinutes * 60_000 > startsAt.getTime()
    )) {
      throw new ConflictException('Ce créneau vient d’être réservé. Veuillez en choisir un autre.');
    }
  }

  private hashCancellationToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}

function statusLabel(status: 'CONFIRMED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED') {
  return {
    CONFIRMED: 'confirmé',
    DECLINED: 'refusé',
    CANCELLED: 'annulé',
    COMPLETED: 'terminé',
  }[status];
}
