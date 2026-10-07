import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationModule } from '../notifications/notification.module.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [AuthModule, PrismaModule, NotificationModule],
  controllers: [AdminController],
})
export class AdminModule {}
