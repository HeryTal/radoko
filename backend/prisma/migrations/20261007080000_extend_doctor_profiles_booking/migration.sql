ALTER TABLE "User"
ADD COLUMN "professionalTitle" TEXT,
ADD COLUMN "professionalType" TEXT NOT NULL DEFAULT 'Médecin',
ADD COLUMN "practiceAddress" TEXT,
ADD COLUMN "profilePhotoUrl" TEXT,
ADD COLUMN "spokenLanguages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "bio" VARCHAR(1200),
ADD COLUMN "experienceYears" INTEGER,
ADD COLUMN "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "consultationFee" INTEGER,
ADD COLUMN "consultationModes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "consultationDurationMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Availability" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Availability_doctorId_weekday_idx"
ON "Availability"("doctorId", "weekday");

ALTER TABLE "Availability"
ADD CONSTRAINT "Availability_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "patientName" TEXT NOT NULL,
  "patientEmail" TEXT NOT NULL,
  "patientPhone" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Appointment_doctorId_startsAt_key"
ON "Appointment"("doctorId", "startsAt");

CREATE INDEX "Appointment_doctorId_startsAt_idx"
ON "Appointment"("doctorId", "startsAt");

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
