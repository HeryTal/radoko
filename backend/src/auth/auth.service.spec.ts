import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { NotificationService } from '../notifications/notification.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  const createUser = vi.fn();
  const findUser = vi.fn();
  const updateUser = vi.fn();
  const findAppointments = vi.fn();
  const createAppointment = vi.fn();
  const findBookingDoctor = vi.fn();
  const queryRaw = vi.fn();
  const enqueueNotification = vi.fn();
  const signToken = vi.fn();

  function nextMondayAtNine() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const currentDate = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const date = new Date(`${currentDate.year}-${currentDate.month}-${currentDate.day}T00:00:00Z`);
    const weekdayName = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Nairobi',
      weekday: 'short',
    });
    const weekdayNumbers: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    for (let day = 0; day < 14; day += 1) {
      const localDate = new Date(date.getTime() + day * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const candidate = new Date(`${localDate}T09:00:00+03:00`);
      if (candidate > now && weekdayNumbers[weekdayName.format(candidate)] === 1) {
        return candidate;
      }
    }
    throw new Error('Could not find a future Monday test slot.');
  }

  beforeEach(async () => {
    createUser.mockReset();
    findUser.mockReset();
    updateUser.mockReset();
    findAppointments.mockReset();
    createAppointment.mockReset();
    findBookingDoctor.mockReset();
    queryRaw.mockReset();
    enqueueNotification.mockReset();
    enqueueNotification.mockResolvedValue(undefined);
    signToken.mockReset();
    signToken.mockResolvedValue('signed-test-token');

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: createUser,
              findUnique: findUser,
              update: updateUser,
            },
            appointment: { findMany: findAppointments, create: createAppointment },
            $transaction: vi.fn(async (callback: (transaction: unknown) => unknown) =>
              callback({
                $queryRaw: queryRaw,
                appointment: {
                  findMany: findAppointments,
                  create: createAppointment,
                },
                availability: { deleteMany: vi.fn(), createMany: vi.fn() },
                verificationDocument: { deleteMany: vi.fn(), create: vi.fn() },
                notificationOutbox: { deleteMany: vi.fn() },
                user: { findFirst: findBookingDoctor, delete: vi.fn() },
              }),
            ),
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: signToken },
        },
        {
          provide: NotificationService,
          useValue: { enqueue: enqueueNotification },
        },
      ],
    }).compile();

    authService = app.get<AuthService>(AuthService);
  });

  it('normalizes email and stores only an Argon2id password hash', async () => {
    const user = {
      id: 'user-id',
      email: 'person@example.com',
      name: 'Person',
      createdAt: new Date(),
    };
    createUser.mockResolvedValue(user);

    const result = await authService.register({
      email: ' Person@Example.com ',
      password: 'correct horse battery staple',
      name: 'Person',
      professionalType: 'Infirmier·ère',
    });

    const [{ data }] = createUser.mock.calls[0];
    expect(data.email).toBe('person@example.com');
    expect(data.professionalType).toBe('Infirmier·ère');
    expect(data.passwordHash).not.toBe('correct horse battery staple');
    expect(
      await argon2.verify(data.passwordHash, 'correct horse battery staple'),
    ).toBe(true);
    expect(result).toEqual(user);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('returns a conflict when the email is already registered', async () => {
    createUser.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      authService.register({
        email: 'person@example.com',
        password: 'correct horse battery staple',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('issues an access token after verifying the password', async () => {
    const password = 'correct horse battery staple';
    const user = {
      id: 'user-id',
      email: 'person@example.com',
      passwordHash: await argon2.hash(password),
    };
    findUser.mockResolvedValue(user);

    await expect(
      authService.login({
        email: ' Person@Example.com ',
        password,
      }),
    ).resolves.toEqual({
      accessToken: 'signed-test-token',
      tokenType: 'Bearer',
      expiresIn: 900,
    });

    expect(findUser).toHaveBeenCalledWith({
      where: { email: 'person@example.com' },
    });
    expect(signToken).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
  });

  it('rejects an incorrect password without issuing a token', async () => {
    findUser.mockResolvedValue({
      id: 'user-id',
      email: 'person@example.com',
      passwordHash: await argon2.hash('the correct password'),
    });

    await expect(
      authService.login({
        email: 'person@example.com',
        password: 'an incorrect password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(signToken).not.toHaveBeenCalled();
  });

  it('creates a reservation only for an available Madagascar-time slot', async () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const currentDate = Object.fromEntries(
      parts.map(({ type, value }) => [type, value]),
    );
    const date = new Date(
      `${currentDate.year}-${currentDate.month}-${currentDate.day}T00:00:00Z`,
    );
    const weekdayName = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Nairobi',
      weekday: 'short',
    });
    const weekdayNumbers: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    let startsAt: Date | undefined;
    for (let day = 0; day < 14; day += 1) {
      const localDate = new Date(date.getTime() + day * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const candidate = new Date(`${localDate}T09:00:00+03:00`);
      const localWeekday = weekdayNumbers[weekdayName.format(candidate)];
      if (candidate > now && localWeekday === 1) {
        startsAt = candidate;
        break;
      }
    }
    if (!startsAt) throw new Error('Could not find a future Monday test slot.');

    findBookingDoctor.mockResolvedValue({
      id: 'doctor-id',
      email: 'doctor@example.com',
      isVerified: true,
      consultationDurationMinutes: 30,
      availabilities: [{ weekday: 1, startTime: '08:00', endTime: '12:00' }],
    });
    findAppointments.mockResolvedValue([]);
    createAppointment.mockResolvedValue({
      id: 'appointment-id',
      startsAt,
      durationMinutes: 30,
      patientName: 'Miora Rakoto',
      patientEmail: 'miora@example.com',
    });

    const booking = await authService.createAppointment('doctor-id', {
      startsAt: startsAt.toISOString(),
      patientName: 'Miora Rakoto',
      patientEmail: 'Miora@example.com',
      patientPhone: '+261 34 00 000 00',
      privacyConsent: true,
    });

    expect(booking).toEqual({
      id: 'appointment-id',
      startsAt,
      durationMinutes: 30,
      status: 'REQUESTED',
    });
    expect(createAppointment).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        doctorId: 'doctor-id',
        patientEmail: 'miora@example.com',
        startsAt,
      }),
    }));
  });

  it('rejects a booking that does not match the doctor’s availability', async () => {
    findBookingDoctor.mockResolvedValue({
      id: 'doctor-id',
      email: 'doctor@example.com',
      isVerified: true,
      consultationDurationMinutes: 30,
      availabilities: [],
    });

    await expect(
      authService.createAppointment('doctor-id', {
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        patientName: 'Miora Rakoto',
        patientEmail: 'miora@example.com',
        patientPhone: '+261 34 00 000 00',
        privacyConsent: true,
      }),
    ).rejects.toThrow('Ce professionnel n’a pas encore ouvert de créneau.');

    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('requires the patient to accept the privacy notice before booking', async () => {
    await expect(
      authService.createAppointment('doctor-id', {
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        patientName: 'Miora Rakoto',
        patientEmail: 'miora@example.com',
        patientPhone: '+261 34 00 000 00',
        privacyConsent: false,
      }),
    ).rejects.toThrow('Votre accord sur le traitement des données est requis.');
    expect(findBookingDoctor).not.toHaveBeenCalled();
  });

  it('rejects a reservation overlapping an existing active appointment', async () => {
    const startsAt = nextMondayAtNine();
    findBookingDoctor.mockResolvedValue({
      id: 'doctor-id',
      email: 'doctor@example.com',
      isVerified: true,
      consultationDurationMinutes: 30,
      availabilities: [{ weekday: 1, startTime: '08:00', endTime: '12:00' }],
    });
    findAppointments.mockResolvedValue([
      { startsAt: new Date(startsAt.getTime() - 15 * 60_000), durationMinutes: 30 },
    ]);

    await expect(
      authService.createAppointment('doctor-id', {
        startsAt: startsAt.toISOString(),
        patientName: 'Miora Rakoto',
        patientEmail: 'miora@example.com',
        patientPhone: '+261 34 00 000 00',
        privacyConsent: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(createAppointment).not.toHaveBeenCalled();
    expect(enqueueNotification).not.toHaveBeenCalled();
  });

  it('returns only booked local times for a valid Madagascar calendar date', async () => {
    findUser.mockResolvedValue({ id: 'doctor-id' });
    findAppointments.mockResolvedValue([
      { startsAt: new Date('2026-10-07T06:30:00.000Z'), durationMinutes: 30 },
    ]);

    await expect(
      authService.getPublicBookedSlots('doctor-id', '2026-10-07'),
    ).resolves.toEqual([
      { startsAt: new Date('2026-10-07T06:30:00.000Z'), durationMinutes: 30 },
    ]);

    expect(findAppointments).toHaveBeenCalledWith({
      where: {
        doctorId: 'doctor-id',
        status: { in: ['REQUESTED', 'CONFIRMED'] },
        startsAt: {
          gte: new Date('2026-10-05T21:00:00.000Z'),
          lt: new Date('2026-10-07T21:00:00.000Z'),
        },
      },
      select: { startsAt: true, durationMinutes: true },
    });
  });

  it('does not expose an email address on a public profile', async () => {
    findUser.mockResolvedValue({ id: 'doctor-id', name: 'Doctor' });

    await authService.getPublicProfile('doctor-id');

    const [query] = findUser.mock.calls[0];
    expect(query.select).not.toHaveProperty('email');
    expect(query.select).not.toHaveProperty('passwordHash');
  });

  it('rejects a profile photo with an unsupported image signature', async () => {
    await expect(
      authService.updateProfilePhoto('doctor-id', {
        fieldname: 'photo',
        originalname: 'photo.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('not an image'),
        size: 12,
      } as Express.Multer.File),
    ).rejects.toThrow('Le fichier choisi n’est pas une image JPG, PNG ou WebP valide.');

    expect(findUser).not.toHaveBeenCalled();
  });

  it('rejects profile photos over the upload limit', async () => {
    await expect(
      authService.updateProfilePhoto('doctor-id', {
        mimetype: 'image/png',
        size: 5 * 1024 * 1024 + 1,
        buffer: Buffer.alloc(8),
      } as Express.Multer.File),
    ).rejects.toThrow('La photo ne peut pas dépasser 5 Mo.');

    expect(findUser).not.toHaveBeenCalled();
  });
});
