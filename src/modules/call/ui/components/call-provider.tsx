"use client";

import { LoaderIcon } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { GeneratedAvatarUri } from '@/lib/avatar';
import { CallConnect } from './call-connect';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { CallControls, CallParticipantsList, SpeakerLayout, StreamCall, StreamTheme, StreamVideo } from '@stream-io/video-react-sdk';

interface Props {
    meetingId: string;    
    meetingName: string;    
}

export const CallProvider = ({ meetingId, meetingName }: Props) => {
    const trpc = useTRPC();
    const { data, isPending } = authClient.useSession();

    if(!data || isPending) {
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
                <LoaderIcon className="size-6 animate-spin text-white" />
            </div>
        )
    }

    const { data: participants } = useQuery({
        ...trpc.meetings.getParticipants.queryOptions({ meetingId }),
        refetchInterval: 5000, // Refresh every 5 seconds
    });

    return (
        <CallConnect
            meetingId={meetingId}
            meetingName={meetingName}
            userId={data.user.id}
            userName={data.user.name}
            userImage={
                data.user.image ??
                GeneratedAvatarUri({
                    seed: data.user.name,
                    variant: "initials",
                })
            }
        />
    )
}

