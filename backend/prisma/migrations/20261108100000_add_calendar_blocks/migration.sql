ALTER TABLE "User" ADD COLUMN "calendarFeedTokenHash" TEXT;
CREATE UNIQUE INDEX "User_calendarFeedTokenHash_key" ON "User"("calendarFeedTokenHash");

CREATE TABLE "CalendarBlock" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "note" VARCHAR(200),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalendarBlock_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CalendarBlock_doctorId_startsAt_endsAt_idx" ON "CalendarBlock"("doctorId", "startsAt", "endsAt");
ALTER TABLE "CalendarBlock" ADD CONSTRAINT "CalendarBlock_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
