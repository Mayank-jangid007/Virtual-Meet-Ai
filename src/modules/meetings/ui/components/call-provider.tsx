// src/modules/meetings/ui/components/call-provider.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Call,
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useTRPC } from "@/trpc/client";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query"; // ✅ Changed to useQuery
import { toast } from "sonner";

interface Props {
  meetingId: string;
  meetingName: string;
}

export const CallProvider = ({ meetingId, meetingName }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);

  // ✅ Use useQuery instead of useSuspenseQuery to avoid POST issue
  const { data: tokenData, isLoading } = useQuery(
    trpc.meetings.generateToken.queryOptions()
  );

  // Join meeting mutation
  const joinMutation = useMutation(
    trpc.meetings.joinMeeting.mutationOptions({
      onError: (error: any) => {
        console.error("Failed to join meeting in DB:", error);
        toast.error("Failed to record meeting participation");
      },
    })
  );

  // Initialize on mount
  useEffect(() => {
    if (!tokenData) return;

    const init = async () => {
      try {
        // First, join the meeting in database
        await joinMutation.mutateAsync({ meetingId });

        const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
        if (!apiKey) {
          toast.error("Stream Video API key is missing");
          return;
        }

        // Initialize Stream Video Client
        const videoClient = new StreamVideoClient({
          apiKey,
          user: {
            id: tokenData.user.id,
            name: tokenData.user.name || "User",
            image: tokenData.user.image || undefined,
          },
          token: tokenData.token,
        });

        // Join the call
        const videoCall = videoClient.call("default", meetingId);
        await videoCall.join({ create: false });

        setClient(videoClient);
        setCall(videoCall);
      } catch (error) {
        console.error("Failed to join call:", error);
        toast.error("Failed to join meeting");
        router.push(`/meetings/${meetingId}`);
      }
    };

    init();

    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
      if (client) {
        client.disconnectUser().catch(console.error);
      }
    };
  }, [tokenData, meetingId]);

  // ✅ Show loading while fetching token
  if (isLoading || !tokenData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading credentials...</p>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Joining {meetingName}...</p>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme>
          <div className="relative h-screen">
            <SpeakerLayout participantsBarPosition="bottom" />
            <CallControlsWithParticipants meetingId={meetingId} />
          </div>
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
};

// Separate component to use Stream hooks
const CallControlsWithParticipants = ({ meetingId }: { meetingId: string }) => {
  const router = useRouter();
  const trpc = useTRPC();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  // Track participants in database - Use useQuery
  const { data: participants } = useQuery(
    trpc.meetings.getParticipants.queryOptions({ meetingId })
  );

  // Leave meeting mutation
  const leaveMutation = useMutation(
    trpc.meetings.leaveMeeting.mutationOptions({
      onSuccess: () => {
        router.push(`/meetings/${meetingId}`);
      },
    })
  );

  // Handle call end
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      leaveMutation.mutate({ meetingId });
    }
  }, [callingState, meetingId]);

  return (
    <>
      <CallControls onLeave={() => leaveMutation.mutate({ meetingId })} />

      {participants && participants.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {participants.length} participant{participants.length !== 1 ? "s" : ""}
        </div>
      )}
    </>
  );
}