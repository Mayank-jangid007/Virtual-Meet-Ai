-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "agentActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agent_connected_at" TIMESTAMP(3),
ADD COLUMN     "agent_disconnected_at" TIMESTAMP(3),
ADD COLUMN     "agent_total_duration" INTEGER;
