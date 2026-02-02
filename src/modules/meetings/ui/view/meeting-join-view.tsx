"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Users, Video, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { format } from "date-fns";

interface Props {
  meetingId: string;
}

export const MeetingJoinView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();

  // 1) Fetch permission first (still use Suspense for security)
  const { data: permission } = useSuspenseQuery(
    trpc.meetings.canJoinMeeting.queryOptions({ meetingId })
  );

  if (!permission?.canJoin) {
    return (
      <Card className="w-full max-w-md">
        <ErrorState
          title="Cannot Join Meeting"
          description={
            "reason" in (permission ?? {})
              ? (permission as any).reason
              : "You don't have access to this meeting"
          }
        />
      </Card>
    );
  }

  // 2) Fetch meeting details and participants in parallel (non-blocking)
  const { data: meetingData, isLoading: isMeetingLoading } = useQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId })
  );

  const { data: participants, isLoading: isParticipantsLoading } = useQuery(
    trpc.meetings.getParticipants.queryOptions({ meetingId })
  );

  const joinMutation = useMutation(
    trpc.meetings.joinMeeting.mutationOptions({
      onSuccess: () => {
        router.push(`/call/${meetingId}`);
      },
    })
  );

  // Show loading while meeting data loads
  if (isMeetingLoading || isParticipantsLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Loading meeting details...</p>
        </CardContent>
      </Card>
    );
  }

  // Extract role and meeting safely
  const userRole = "role" in permission ? (permission as any).role : null;
  const meeting = meetingData?.existingMeeting;

  if (!meeting) {
    return (
      <Card className="w-full max-w-md">
        <ErrorState title="Meeting not found" description="This meeting could not be loaded." />
      </Card>
    );
  }

  const participantList = participants ?? [];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          {meeting.name}
        </CardTitle>
        <CardDescription>You're about to join this meeting</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meeting Info */}
        <div className="space-y-2 text-sm">
          {meeting.startedAt && (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(meeting.startedAt), "PPP")}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {format(new Date(meeting.startedAt), "p")}
              </div>
            </>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            {participantList.length} participant
            {participantList.length !== 1 ? "s" : ""} in the meeting
          </div>
        </div>

        {/* Participants Preview */}
        {participantList.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Who's here</div>
            <div className="flex -space-x-2">
              {participantList.slice(0, 5).map((p: any) => (
                <Avatar key={p.id} className="border-2 border-background">
                  <AvatarImage src={p.user.image || undefined} />
                  <AvatarFallback>
                    {p.user.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {participantList.length > 5 && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                  +{participantList.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Join Button */}
        <Button
          onClick={() => joinMutation.mutate({ meetingId })}
          disabled={joinMutation.isPending}
          className="w-full"
          size="lg"
        >
          {joinMutation.isPending ? "Joining..." : "Join Meeting"}
        </Button>

        {/* Show host note if joining as host */}
        {userRole === "HOST" && (
          <p className="text-xs text-center text-muted-foreground">
            You're joining as the host
          </p>
        )}
      </CardContent>
    </Card>
  );
};