CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Appointment"
ADD COLUMN "reviewTokenHash" TEXT,
ADD COLUMN "reviewTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Appointment_reviewTokenHash_key" ON "Appointment"("reviewTokenHash");

CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" VARCHAR(1000),
  "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "doctorResponse" VARCHAR(1000),
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Review_appointmentId_key" ON "Review"("appointmentId");
CREATE INDEX "Review_doctorId_status_createdAt_idx" ON "Review"("doctorId", "status", "createdAt");
ALTER TABLE "Review" ADD CONSTRAINT "Review_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
