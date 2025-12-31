import { useState } from "react";
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./calll-ended";

interface Props {
    meetingName: string;
}; 

export const CallUI = ({ meetingName }: Props) =>{
    const call = useCall();
    const [show, setShow] = useState<'lobby' | 'call' | 'ended'>('lobby');

    const handleJoin = async () =>{
        if(!call) return;
        
        // Enable microphone when joining so agent can hear the user
        try {
            await call.microphone.enable();
        } catch (error) {
            console.warn('⚠️ Could not enable microphone:', error);
        }
        
        await call.join();
        
        setShow('call');
    };

    const handleLeave = () =>{
        if(!call) return; 

        call.endCall();
        setShow('ended');

    };

    return (
        <StreamTheme className="h-full">
            {show === 'lobby' && <CallLobby onJoin={handleJoin}/> }
            {show === 'call' && <CallActive onLeave={handleLeave} meetingName={meetingName} /> }
            {show === 'ended' && <CallEnded />}
        </StreamTheme>
    )

}