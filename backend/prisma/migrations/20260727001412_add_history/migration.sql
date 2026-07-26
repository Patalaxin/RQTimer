-- CreateEnum
CREATE TYPE "HistoryType" AS ENUM ('updateMobByCooldown', 'updateMobDateOfDeath', 'updateMobDateOfRespawn', 'crashMobServer', 'respawnLost');

-- CreateTable
CREATE TABLE "history" (
    "id" TEXT NOT NULL,
    "mobId" TEXT,
    "mobName" TEXT NOT NULL,
    "location" TEXT,
    "nickname" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "server" "Server" NOT NULL,
    "groupName" TEXT,
    "historyTypes" "HistoryType" NOT NULL,
    "date" DOUBLE PRECISION NOT NULL,
    "toWillResurrect" DOUBLE PRECISION,
    "fromCooldown" INTEGER,
    "toCooldown" INTEGER,
    "crashServer" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "history_server_groupName_date_idx" ON "history"("server", "groupName", "date");

-- CreateIndex
CREATE INDEX "history_server_groupName_mobId_date_idx" ON "history"("server", "groupName", "mobId", "date");

-- CreateIndex
CREATE INDEX "history_expiresAt_idx" ON "history"("expiresAt");
