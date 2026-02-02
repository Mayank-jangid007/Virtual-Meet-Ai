-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('HOST', 'CO_HOST', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxParticipants" INTEGER DEFAULT 10;

-- CreateTable
CREATE TABLE "meeting_participant" (
    "id" TEXT NOT NULL,
    "meeting_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "role" "ParticipantRole" NOT NULL DEFAULT 'PARTICIPANT',

    CONSTRAINT "meeting_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_invitation" (
    "id" TEXT NOT NULL,
    "meeting_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "meeting_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meeting_participant_meeting_id_user_id_key" ON "meeting_participant"("meeting_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_invitation_meeting_id_email_key" ON "meeting_invitation"("meeting_id", "email");

-- AddForeignKey
ALTER TABLE "meeting_participant" ADD CONSTRAINT "meeting_participant_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participant" ADD CONSTRAINT "meeting_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_invitation" ADD CONSTRAINT "meeting_invitation_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_invitation" ADD CONSTRAINT "meeting_invitation_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
