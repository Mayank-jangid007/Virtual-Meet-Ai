-- Add the missing columns directly to bypass migration conflicts
ALTER TABLE "Meeting" 
ADD COLUMN IF NOT EXISTS "agentActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "agent_connected_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "agent_disconnected_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "agent_total_duration" INTEGER;

-- Add enum values if they don't exist (PostgreSQL 9.1+)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PROCESSING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MeetingStatus')) THEN
        ALTER TYPE "MeetingStatus" ADD VALUE 'PROCESSING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ACTIVE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MeetingStatus')) THEN
        ALTER TYPE "MeetingStatus" ADD VALUE 'ACTIVE';
    END IF;
END $$;
