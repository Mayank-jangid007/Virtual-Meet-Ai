// src/app/meetings/[meetingId]/join/page.tsx
import { Suspense } from "react";
import { MeetingJoinView } from "@/modules/meetings/ui/view/meeting-join-view";
import { LoadingState } from "@/components/loading-state";                          

interface Props {
  params: Promise<{ meetingId: string }>;
}

export default async function MeetingJoinPage({ params }: Props) {
  const { meetingId } = await params;

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Suspense
        fallback={
          <LoadingState
            title="Loading meeting..."
            description="Please wait while we load your meeting."
          />
        }
      >
        <MeetingJoinView meetingId={meetingId} />
      </Suspense>
    </div>
  );
}