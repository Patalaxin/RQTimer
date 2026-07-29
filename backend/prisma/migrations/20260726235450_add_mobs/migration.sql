-- CreateTable
CREATE TABLE "mobs" (
    "id" TEXT NOT NULL,
    "mobName" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "respawnText" TEXT,
    "location" TEXT NOT NULL,
    "cooldownTime" INTEGER NOT NULL,
    "image" TEXT,
    "mobType" TEXT NOT NULL,

    CONSTRAINT "mobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mobs_location_mobName_key" ON "mobs"("location", "mobName");
