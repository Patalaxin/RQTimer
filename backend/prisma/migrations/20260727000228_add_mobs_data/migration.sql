-- CreateEnum
CREATE TYPE "Server" AS ENUM ('Helios', 'Fenix');

-- CreateTable
CREATE TABLE "mobs_data" (
    "mobId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "server" "Server" NOT NULL,
    "respawnTime" DOUBLE PRECISION,
    "deathTime" DOUBLE PRECISION,
    "cooldown" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT,
    "respawnLost" BOOLEAN NOT NULL DEFAULT false,
    "mobTypeAdditionalTime" TEXT NOT NULL,

    CONSTRAINT "mobs_data_pkey" PRIMARY KEY ("mobId","groupName","server")
);

-- AddForeignKey
ALTER TABLE "mobs_data" ADD CONSTRAINT "mobs_data_mobId_fkey" FOREIGN KEY ("mobId") REFERENCES "mobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
