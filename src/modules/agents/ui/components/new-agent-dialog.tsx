import { ResponseiveDialog } from "@/components/reponsive-dialog";
import { AgentForm } from "./agents-forms";

interface NewAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NewAgentDialog = ({open, onOpenChange}: NewAgentDialogProps) =>{

    return (
        <ResponseiveDialog
            title="New Agent"
            description="Create a new agent"
            open={open}
            onOpenChange={onOpenChange}
        >
            
            <AgentForm
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
            />
        </ResponseiveDialog>
    )
}