import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../interfaces/authenticated-request.interface.js';

const JWT_ERROR_NAMES = new Set([
  'JsonWebTokenError',
  'NotBeforeError',
  'TokenExpiredError',
]);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      throw new UnauthorizedException('Un jeton Bearer est requis.');
    }

    let payload: Partial<AuthenticatedUser>;
    try {
      payload = await this.jwtService.verifyAsync<
        Partial<AuthenticatedUser>
      >(match[1]);
    } catch (error) {
      if (error instanceof Error && JWT_ERROR_NAMES.has(error.name)) {
        throw new UnauthorizedException('Le jeton est invalide ou expiré.');
      }

      throw error;
    }

    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      throw new UnauthorizedException('Le jeton est invalide ou expiré.');
    }

    request.user = {
      sub: payload.sub,
      email: payload.email,
    };
    return true;
  }
}
