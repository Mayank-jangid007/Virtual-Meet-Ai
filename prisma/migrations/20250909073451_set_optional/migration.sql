/*
  Warnings:

  - The primary key for the `Meeting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `agentId` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `Meeting` table. All the data in the column will be lost.
  - The `id` column on the `Meeting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `agent_id` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MeetingStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."Meeting" DROP CONSTRAINT "Meeting_agentId_fkey";

-- AlterTable
ALTER TABLE "public"."Meeting" DROP CONSTRAINT "Meeting_pkey",
DROP COLUMN "agentId",
DROP COLUMN "topic",
ADD COLUMN     "agent_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "public"."MeetingStatus" NOT NULL DEFAULT 'UPCOMING',
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "transcriptionUrl" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
