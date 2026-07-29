-- CreateTable
CREATE TABLE "otp_verifications" (
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("email")
);
