"use client"
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MeetingStatus } from "@/generated/prisma";
import { ErrorState } from "@/components/error-state";
import { CallProvider } from "../components/call-provider";

interface Props {
    meetingId: string;
};

export const CallView = ({ meetingId }: Props) => {
    const trpc = useTRPC();
    
    
    const  { data } = useSuspenseQuery(trpc.meetings.getOne.queryOptions({ id: meetingId }))
    
    if (!meetingId) {
        return <div>Meeting ID is required</div>;
    }

    if(data.existingMeeting.status === MeetingStatus.COMPLETED){
        return (
            <div className="flex h-screen items-center justify-center">
                <ErrorState 
                    title="Meeting has ended"
                    description="You can no longer join this"
                />
            </div>
        )
    }

    return  <CallProvider meetingId={meetingId} meetingName={data.existingMeeting.name} />   
}