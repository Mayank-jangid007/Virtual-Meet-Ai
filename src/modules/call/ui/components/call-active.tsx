import Link from 'next/link'
import Image from 'next/image'
import { CallControls, SpeakerLayout, useCallStateHooks, useCall } from '@stream-io/video-react-sdk'
import { useEffect } from 'react';


interface Props {
    onLeave: () => void;
    meetingName: string;
}

export const CallActive = ({ onLeave, meetingName }: Props) => {
    const call = useCall();
    const { useParticipants, useMicrophoneState } = useCallStateHooks();
    const participants = useParticipants();
    const { isEnabled: isMicEnabled } = useMicrophoneState();

    // Debug: Log participants to see if agent is connected
    useEffect(() => {
        console.log('👥 Participants in call:', participants.map(p => ({
            id: p.userId,
            name: p.name,
            sessionId: p.sessionId,
            publishedTracks: Object.keys(p.publishedTracks)
        })));
    }, [participants]);

    // Ensure microphone is enabled when call is active
    useEffect(() => {
        if (call && !isMicEnabled) {
            console.log('🎤 Enabling microphone for agent to hear...');
            call.microphone.enable().catch((error) => {
                console.error('❌ Failed to enable microphone:', error);
            });
        }
    }, [call, isMicEnabled]);

    // Listen for transcription events to debug
    useEffect(() => {
        if (!call) return;

        const handleTranscription = (event: any) => {
            console.log('📝 Transcription event:', event);
        };

        call.on('transcription.created', handleTranscription);
        call.on('transcription.updated', handleTranscription);

        return () => {
            call.off('transcription.created', handleTranscription);
            call.off('transcription.updated', handleTranscription);
        };
    }, [call]);

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
            <div className='bg-[#101213] rounded-full px-4'>
                <CallControls onLeave={onLeave} />
            </div>
        </div>
    )
}