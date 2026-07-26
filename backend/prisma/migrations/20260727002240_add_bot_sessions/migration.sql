-- CreateTable
CREATE TABLE "bot_sessions" (
    "id" TEXT NOT NULL,
    "userId" DOUBLE PRECISION,
    "email" TEXT,
    "groupName" TEXT,
    "server" "Server",
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT,

    CONSTRAINT "bot_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_sessions_userId_key" ON "bot_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bot_sessions_email_key" ON "bot_sessions"("email");
