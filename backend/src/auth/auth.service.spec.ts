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

describe('AuthService', () => {
  let authService: AuthService;
  const createUser = vi.fn();
  const findUser = vi.fn();
  const signToken = vi.fn();

  beforeEach(async () => {
    createUser.mockReset();
    findUser.mockReset();
    signToken.mockReset();
    signToken.mockResolvedValue('signed-test-token');

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: { user: { create: createUser, findUnique: findUser } },
        },
        {
          provide: JwtService,
          useValue: { signAsync: signToken },
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
    });

    const [{ data }] = createUser.mock.calls[0];
    expect(data.email).toBe('person@example.com');
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
});
