"use client"

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { MeetingIdViewHeader } from "../components/meeting-id-view-header";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";
import { useState } from "react";
import { UpcomingState } from "../components/upcoming-state";
import { ActiveState } from "../components/active-state";
import { CancelledState } from "../components/cancelled-state";
import { ProcessingState } from "../components/processing-state";
import { CompletedState } from "../components/completed-state";

interface Props{
    meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) =>{
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [RemoveConfirmation, confirmRemove] = useConfirm(
        'Are you sure',
        'The following action will remove this meeting'
    )
    
    if (!meetingId) {
        return <div>Meeting ID is required</div>;
    }
    
    const { data } = useSuspenseQuery(
        trpc.meetings.getOne.queryOptions({ id: meetingId }),
    )
    const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

    const removeMeeting = useMutation(
        trpc.meetings.remove.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}))
                router.push('/meetings')
            }
        })
    )

    const handleRemoveMeeting = async () =>{
        const ok = await confirmRemove();

        if(!ok) return;

        await removeMeeting.mutateAsync({ id: meetingId })
    }

    const isActive = data.existingMeeting.status == 'ACTIVE'; 
    const isUpcoming = data.existingMeeting.status == 'UPCOMING'; 
    const isCancelled = data.existingMeeting.status == 'CANCELLED'; 
    const isCompleted = data.existingMeeting.status == 'COMPLETED'; 
    const isProcessing = data.existingMeeting.status == 'PROCESSING'; 

    return (
        <>
            <RemoveConfirmation />
            <UpdateMeetingDialog
                open={updateMeetingDialogOpen}
                onOpenChange={setUpdateMeetingDialogOpen}
                initialValues={data}
            />
            <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gp-y-4">
                <MeetingIdViewHeader
                    meetingId={meetingId}
                    meetingName={data.existingMeeting.name}
                    onEdit={() => setUpdateMeetingDialogOpen(true)}
                    onRemove={handleRemoveMeeting}
                />
                {isCancelled && <CancelledState />}
                {isProcessing && <ProcessingState />}
                {isCompleted && <CompletedState data={data} />}
                {isActive && <ActiveState meetingId={meetingId} />}
                {isUpcoming && (
                    <UpcomingState 
                        meetingId={meetingId}
                        onCancleMeeting={() => {}}
                        isCancelling={false}
                    />
                )}
            </div>
        </>
    )
}


export function MeetingIdViewLoading() {
    return <div>
             <LoadingState
                title='Loading Meetings'
                description='This may take a few seconds'
            />
        </div>
  }
  export function MeetingIdViewError() {
    return  <div>
                <ErrorState
                    title='Error loading Meetings'
                    description='Please try again later'
                />
            </div>
  }