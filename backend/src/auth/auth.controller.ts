import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import type { Express } from 'express';
import { AuthService } from './auth.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto.js';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto.js';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('me/verification-document')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0 },
      fileFilter: (_request, file, callback) => {
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
          callback(new BadRequestException('Choisissez un justificatif PDF, JPG ou PNG.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadVerificationDocument(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Sélectionnez un justificatif à envoyer.');
    return this.authService.uploadVerificationDocument(request.user.sub, file);
  }

  @Post('me/photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
      fileFilter: (_request, file, callback) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
          callback(
            new BadRequestException('Choisissez une image JPG, PNG ou WebP.'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadProfilePhoto(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Sélectionnez une photo à envoyer.');
    }
    return this.authService.updateProfilePhoto(request.user.sub, file);
  }

  @Patch('me/appointments/:appointmentId/status')
  @UseGuards(JwtAuthGuard)
  updateAppointmentStatus(
    @Req() request: AuthenticatedRequest,
    @Param('appointmentId') appointmentId: string,
    @Body() input: UpdateAppointmentStatusDto,
  ) {
    return this.authService.updateAppointmentStatus(
      request.user.sub,
      appointmentId,
      input.status,
    );
  }

  @Patch('me/appointments/:appointmentId/reschedule')
  @UseGuards(JwtAuthGuard)
  rescheduleAppointment(
    @Req() request: AuthenticatedRequest,
    @Param('appointmentId') appointmentId: string,
    @Body() input: RescheduleAppointmentDto,
  ) {
    return this.authService.rescheduleAppointment(
      request.user.sub,
      appointmentId,
      input.startsAt,
    );
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  deleteMyAccount(@Req() request: AuthenticatedRequest) {
    return this.authService.deleteMyAccount(request.user.sub);
  }

  @Delete('me/photo')
  @UseGuards(JwtAuthGuard)
  removeProfilePhoto(@Req() request: AuthenticatedRequest) {
    return this.authService.removeProfilePhoto(request.user.sub);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.user.sub);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() input: UpdateDoctorProfileDto,
  ) {
    return this.authService.updateProfile(request.user.sub, input);
  }

  @Patch('me/availability')
  @UseGuards(JwtAuthGuard)
  updateAvailability(
    @Req() request: AuthenticatedRequest,
    @Body() input: UpdateAvailabilityDto,
  ) {
    return this.authService.updateAvailability(request.user.sub, input);
  }

  @Get('me/appointments')
  @UseGuards(JwtAuthGuard)
  getAppointments(@Req() request: AuthenticatedRequest) {
    return this.authService.getAppointments(request.user.sub);
  }

  @Get('public')
  searchPublicProfiles(
    @Query('specialty') specialty?: string,
    @Query('city') city?: string,
  ) {
    return this.authService.searchPublicProfiles(specialty, city);
  }

  @Get('public/:doctorId')
  getPublicProfile(@Param('doctorId') doctorId: string) {
    return this.authService.getPublicProfile(doctorId);
  }

  @Get('public/:doctorId/slots')
  getPublicBookedSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.authService.getPublicBookedSlots(doctorId, date);
  }

  @Post('public/:doctorId/appointments')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createAppointment(
    @Param('doctorId') doctorId: string,
    @Body() input: CreateAppointmentDto,
  ) {
    return this.authService.createAppointment(doctorId, input);
  }

  @Post('public/appointments/cancel')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  cancelPublicAppointment(@Body() input: CancelAppointmentDto) {
    return this.authService.cancelAppointmentWithToken(input.token);
  }

  @Post('public/appointments/erase-data')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  erasePatientData(@Body() input: CancelAppointmentDto) {
    return this.authService.erasePatientDataWithToken(input.token);
  }
}
