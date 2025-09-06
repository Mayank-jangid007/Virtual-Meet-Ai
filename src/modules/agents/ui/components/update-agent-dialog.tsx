import { ResponseiveDialog } from "@/components/reponsive-dialog";
import { AgentForm } from "./agents-forms";
import { AgentGetOne } from "../types";

interface UpdateAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues: AgentGetOne
}

export const NewAgentDialog = ({open, onOpenChange, initialValues}: UpdateAgentDialogProps) =>{

    return (
        <ResponseiveDialog
            title="Edit Agent"
            description="Edit the agent details"
            open={open}
            onOpenChange={onOpenChange}
        >
            
            <AgentForm
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
                initialValues={initialValues}
            />
        </ResponseiveDialog>
    )
}