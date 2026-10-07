import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { NotificationService } from '../notifications/notification.service.js';
import { RejectProfessionalDto } from './dto/reject-professional.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  @Get('professionals/pending')
  getPendingProfessionals() {
    return this.prisma.user.findMany({
      where: { role: 'PROFESSIONAL', verificationStatus: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        professionalType: true,
        specialty: true,
        practiceCity: true,
        phone: true,
        createdAt: true,
        verificationNote: true,
        verificationDocuments: {
          select: { id: true, fileName: true, mimeType: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  @Get('verification-documents/:documentId')
  async getVerificationDocument(
    @Param('documentId') documentId: string,
    @Res() response: Response,
  ) {
    const document = await this.prisma.verificationDocument.findUnique({
      where: { id: documentId },
    });
    if (!document) throw new NotFoundException('Justificatif introuvable.');
    response.setHeader('Content-Type', document.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.fileName)}"`);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.send(Buffer.from(document.content));
  }

  @Patch('professionals/:doctorId/approve')
  async approveProfessional(@Param('doctorId') doctorId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const doctor = await transaction.user.findFirst({
        where: {
          id: doctorId,
          role: 'PROFESSIONAL',
          verificationStatus: 'PENDING',
          verificationDocuments: { some: {} },
        },
        select: { id: true, email: true },
      });
      if (!doctor) throw new NotFoundException('Professionnel introuvable ou sans justificatif.');
      const changed = await transaction.user.updateMany({
        where: { id: doctorId, verificationStatus: 'PENDING' },
        data: { isVerified: true, verificationStatus: 'APPROVED', verificationNote: null },
      });
      if (!changed.count) throw new ConflictException('Ce profil a déjà fait l’objet d’une décision.');
      await transaction.verificationDocument.deleteMany({ where: { doctorId } });
      await this.notifications.enqueue(
        doctor.email,
        'Votre profil Radoko a été vérifié',
        'Votre profil professionnel a été vérifié par Radoko. Il est maintenant visible dans les résultats de recherche.',
        undefined,
        transaction,
      );
      return { id: doctorId, isVerified: true };
    });
  }

  @Patch('professionals/:doctorId/reject')
  async rejectProfessional(
    @Param('doctorId') doctorId: string,
    @Body() input: RejectProfessionalDto,
  ) {
    const reason = input.reason.trim();
    if (reason.length < 5) {
      throw new BadRequestException('Le motif de refus doit contenir au moins 5 caractères.');
    }
    return this.prisma.$transaction(async (transaction) => {
      const doctor = await transaction.user.findFirst({
        where: { id: doctorId, role: 'PROFESSIONAL', verificationStatus: 'PENDING' },
        select: { id: true, email: true },
      });
      if (!doctor) throw new NotFoundException('Professionnel introuvable ou déjà vérifié.');
      const updated = await transaction.user.updateMany({
        where: { id: doctorId, verificationStatus: 'PENDING' },
        data: { isVerified: false, verificationStatus: 'REJECTED', verificationNote: reason },
      });
      if (!updated.count) throw new ConflictException('Ce profil a déjà fait l’objet d’une décision.');
      await transaction.verificationDocument.deleteMany({ where: { doctorId } });
      await this.notifications.enqueue(
        doctor.email,
        'Votre profil Radoko nécessite une modification',
        `Votre profil n’a pas été validé pour le motif suivant : ${reason}\n\nVous pouvez corriger votre profil et téléverser un nouveau justificatif depuis votre espace professionnel.`,
        undefined,
        transaction,
      );
      return { id: doctorId, isVerified: false, verificationNote: reason };
    });
  }
}
