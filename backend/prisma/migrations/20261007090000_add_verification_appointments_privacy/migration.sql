CREATE TYPE "UserRole" AS ENUM ('PROFESSIONAL', 'ADMIN');
CREATE TYPE "AppointmentStatus" AS ENUM (
  'REQUESTED',
  'CONFIRMED',
  'DECLINED',
  'CANCELLED',
  'COMPLETED'
);
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENDING', 'SENT');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'PROFESSIONAL',
ADD COLUMN "verificationNote" VARCHAR(500);

ALTER TABLE "Appointment"
DROP CONSTRAINT IF EXISTS "Appointment_doctorId_startsAt_key",
ADD COLUMN "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
ADD COLUMN "cancellationTokenHash" TEXT,
ADD COLUMN "cancellationExpiresAt" TIMESTAMP(3),
ADD COLUMN "patientPrivacyTokenHash" TEXT,
ADD COLUMN "patientPrivacyTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "privacyConsentAt" TIMESTAMP(3),
ADD COLUMN "anonymizedAt" TIMESTAMP(3),
ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Appointment_cancellationTokenHash_key"
ON "Appointment"("cancellationTokenHash");
CREATE UNIQUE INDEX "Appointment_patientPrivacyTokenHash_key"
ON "Appointment"("patientPrivacyTokenHash");
CREATE INDEX "Appointment_status_startsAt_idx"
ON "Appointment"("status", "startsAt");

CREATE TABLE "VerificationDocument" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "content" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationDocument_doctorId_createdAt_idx"
ON "VerificationDocument"("doctorId", "createdAt");

ALTER TABLE "VerificationDocument"
ADD CONSTRAINT "VerificationDocument_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NotificationOutbox" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT,
  "recipient" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" VARCHAR(1000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationOutbox_status_createdAt_idx"
ON "NotificationOutbox"("status", "nextAttemptAt");
