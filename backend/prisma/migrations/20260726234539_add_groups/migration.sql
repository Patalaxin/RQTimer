-- CreateTable
CREATE TABLE "groups" (
    "name" TEXT NOT NULL,
    "groupLeader" TEXT NOT NULL,
    "members" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canMembersAddMobs" BOOLEAN NOT NULL DEFAULT false,
    "inviteCode" TEXT,
    "inviteCodeCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_inviteCode_key" ON "groups"("inviteCode");
