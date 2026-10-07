ALTER TYPE "NotificationStatus" ADD VALUE IF NOT EXISTS 'SENDING';

ALTER TABLE "Appointment"
ADD COLUMN IF NOT EXISTS "patientPrivacyTokenHash" TEXT,
ADD COLUMN IF NOT EXISTS "patientPrivacyTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_patientPrivacyTokenHash_key"
ON "Appointment"("patientPrivacyTokenHash");
