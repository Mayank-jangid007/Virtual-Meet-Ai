import Link from 'next/link'
import Image from 'next/image'
import { CallControls, SpeakerLayout, useCallStateHooks, useCall } from '@stream-io/video-react-sdk'
import { useEffect, useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';


interface Props {
    onLeave: () => void;
    meetingName: string;
    meetingId: string
}


export const CallActive = ({ onLeave, meetingName, meetingId }: Props) => {
    const call = useCall();
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();

    const trpc = useTRPC();
    const [isTogglingAgent, setIsTogglingAgent] = useState(false);

    // Poll agent status every 5 seconds for real-time updates
    const { data: agentStatus, refetch: refetchAgentStatus } = useQuery( //  useQuery Fetches data from the backend and caches it. so useQuery is for reading data only when use it when you create you endpoint .query then if use mutation on backend and use usequery then it donsnt work beacouse it will not matches the pattern
        trpc.meetings.getAgentStatus.queryOptions({ meetingId })
    );

    // Auto-refresh agent status every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refetchAgentStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [refetchAgentStatus]);

    // Toggle agent mutation
    const toggleAgentMutation = useMutation(trpc.meetings.toggleAgent.mutationOptions({ // so with the use of useMutation we can update the data and seding to backend . you are using .mutation on your endpoint that's why we are usinig here usemutation becouse its for updating and also you have to se the pattern what you use on you backend endpoint 
        onSuccess: (data) => {
            console.log('✅ Toggle agent success:', data);

            // Wait a bit for database to update, then refetch
            setTimeout(() => {
                refetchAgentStatus();
                setIsTogglingAgent(false);
            }, 500); // 500ms delay to ensure DB is updated
        },
        onError: (error) => {
            console.error('Failed to toggle agent:', error);
            alert(error.message || 'Failed to toggle agent');
            setIsTogglingAgent(false);
        }
    }));

    const handleToggleAgent = async () => {
        if (isTogglingAgent) return;

        console.log('🔄 Toggling agent. Current status:', agentStatus);
        setIsTogglingAgent(true);
        const enable = !agentStatus?.isActive;
        console.log('📤 Sending toggle request with enable:', enable);

        toggleAgentMutation.mutate({ // mutate injecting data 
            meetingId,
            enable
        });
    };

    // Debug: Log participants to see if agent is connected
    useEffect(() => {
        console.log('👥 Participants in call:', participants.map(p => ({
            id: p.userId,
            name: p.name,
            sessionId: p.sessionId,
            publishedTracks: Object.keys(p.publishedTracks)
        })));
    }, [participants]);

    // Listen for transcription events to debug
    useEffect(() => {
        if (!call) return;

        const handleTranscriptionStarted = (event: any) => {
            console.log('📝 Transcription started:', event);
        };

        const handleClosedCaption = (event: any) => {
            console.log('📝 Closed caption (transcription update):', event);
        };

        call.on('call.transcription_started', handleTranscriptionStarted);
        call.on('call.closed_caption', handleClosedCaption);

        return () => {
            call.off('call.transcription_started', handleTranscriptionStarted);
            call.off('call.closed_caption', handleClosedCaption);
        };
    }, [call]);

    // const isAgentActive = agentStatus?.isActive || false;

    const isAgentActive = agentStatus?.isActive || false

    return (
        <div className="flex flex-col justify-between p-4 h-full text-white">
            <div className="bg-[#101213] rounded-full p-4 flex items-center gap-4">
                <Link href="/" className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit">
                    <Image src="/logo.svg" width={22} height={22} alt="Logo" />
                </Link>
                <h4 className='text-base'>
                    {meetingName}
                </h4>
                {/* Debug: Show participant count */}
                <span className="text-xs text-muted-foreground">
                    ({participants.length} participant{participants.length !== 1 ? 's' : ''})
                </span>
            </div>
            <SpeakerLayout />
            <div className='bg-[#101213] rounded-full px-4 flex items-center justify-between'>
                <CallControls onLeave={onLeave} />

                {/* AI Agent Toggle Button */}

                <button
                    onClick={handleToggleAgent}
                    disabled={isTogglingAgent}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-full transition-all
                        ${isAgentActive
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-600 hover:bg-gray-700'
                        }
                        ${isTogglingAgent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    title={isAgentActive ? 'Disable AI Agent' : 'Enable AI Agent'}
                >
                    {isTogglingAgent ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <Bot className={`size-5 ${isAgentActive ? 'text-white' : 'text-gray-300'}`} />
                    )}
                    <span className="text-sm font-medium">
                        {isTogglingAgent
                            ? 'Processing...'
                            : isAgentActive
                                ? 'Disable AI Agent'
                                : 'Enable AI Agent'
                        }
                    </span>
                </button>
            </div>
        </div>
    )
}