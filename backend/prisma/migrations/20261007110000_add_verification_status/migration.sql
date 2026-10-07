CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "User"
ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "User"
SET "verificationStatus" = 'APPROVED'
WHERE "isVerified" = true;
