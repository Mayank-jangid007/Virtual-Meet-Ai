import { ResponseiveDialog } from "@/components/reponsive-dialog";
import { MeetingForm } from "./meeting-form";
import { useRouter } from "next/navigation";

interface NewMeetingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NewMeetingDialog = ({open, onOpenChange}: NewMeetingDialogProps) =>{
    const router = useRouter()
    return (
        <ResponseiveDialog
            title="New Meeting"
            description="Create a new meeting"
            open={open}
            onOpenChange={onOpenChange}
        >   
            <MeetingForm
                onSuccess={(id) =>{
                    if (id) {
                        onOpenChange(false);
                        router.push(`/meetings/${id}`);
                    }
                }}
                onCancel={() => onOpenChange(false)}
                // onCancel={() => router.back()}
            />
        </ResponseiveDialog>
    )
}