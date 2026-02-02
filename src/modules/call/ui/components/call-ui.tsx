import { useState } from "react";
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./calll-ended";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

interface Props {
    meetingName: string;
    meetingId: string;
};

export const CallUI = ({ meetingName, meetingId }: Props) => {
    const call = useCall();
    const [show, setShow] = useState<'lobby' | 'call' | 'ended'>('lobby');
    const trpc = useTRPC();

    // Leave meeting mutation to update database
    const leaveMutation = useMutation(
        trpc.meetings.leaveMeeting.mutationOptions({
            onError: (error) => {
                console.error('Failed to update leave status:', error);
                // Still show ended screen even if DB update fails
            }
        })
    );

    const handleJoin = async () => {
        if (!call) return;

        // Enable microphone when joining so agent can hear the user
        try {
            await call.microphone.enable();
        } catch (error) {
            console.warn('⚠️ Could not enable microphone:', error);
        }

        await call.join();

        setShow('call');
    };

    const handleLeave = async () => {
        if (!call) return;

        // ✅ Check if agent is active and warn host before leaving
        try {
            const agentStatus = await trpc.meetings.getAgentStatus.query({ meetingId });

            if (agentStatus?.agentActive) {
                const confirmed = window.confirm(
                    '⚠️ The AI Agent is currently active.\n\n' +
                    'Leaving the call will automatically disconnect the agent.\n\n' +
                    'Do you want to continue?'
                );

                if (!confirmed) {
                    console.log('❌ User cancelled leave (agent still active)');
                    return; // Don't leave
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not check agent status:', error);
            // Continue with leave anyway
        }

        // Update database first
        try {
            await leaveMutation.mutateAsync({ meetingId });
            console.log('✅ Leave status updated in database');
        } catch (error) {
            console.error('❌ Failed to update leave status:', error);
        }

        // Leave the call (only for this user, not ending for everyone)
        try {
            // Check if we're still in the call before trying to leave
            const state = call.state;
            const isInCall = state.callingState === 'joined' || state.callingState === 'joining';

            if (isInCall) {
                await call.leave();
                console.log('Successfully left the call');
            } else {
                console.log('Already left the call, skipping leave');
            }
        } catch (error) {
            console.warn('⚠️ Error leaving call (may have already left):', error);
            // Continue anyway to show ended screen
        }

        setShow('ended');
    };

    return (
        <StreamTheme className="h-full">
            {show === 'lobby' && <CallLobby onJoin={handleJoin} />}
            {show === 'call' && <CallActive onLeave={handleLeave} meetingName={meetingName} meetingId={meetingId} />}
            {show === 'ended' && <CallEnded />}
        </StreamTheme>
    )

}