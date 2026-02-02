import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { meetingsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; 
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { 
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"; 
import { toast } from "sonner";

import { MeetingGetOne } from "../../types";
import { useState } from "react";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatarProp } from "@/components/ui/generated_avatar";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";
import { useRouter } from "next/navigation";



interface MeetingFormProps {
    onSuccess?: (id?: string) => void;
    onCancel?: () => void;
    initialValues?: MeetingGetOne;
}

export const MeetingForm = ({
    onSuccess,
    onCancel,
    initialValues
}: MeetingFormProps) =>{
    const trpc = useTRPC();
    const router = useRouter()
    const queryClient = useQueryClient();

    const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false)
    const [agentSearch, setAgentSearch] = useState("")

    const agents = useQuery(
        trpc.agents.getMany.queryOptions({
            pageSize: 100,
            search: agentSearch,
        })
    )

    const createMeeting = useMutation(
        trpc.meetings.create.mutationOptions({
            onSuccess: async (data) => {
                // yahan pe getMany ki jagah getAll use karo, kyunki getMany exist nahi karta
                console.log('✅ Mutation successful! Data:', data);

                await queryClient.invalidateQueries(
                    trpc.meetings.getMany.queryOptions({})
                );

                await queryClient.invalidateQueries( // We use invalidateQueries(...) to refresh the list so that the new agent appears in the list
                    trpc.premium.getFreeUsage.queryOptions()
                );

                onSuccess?.(data.id)
            },
            onError: (error) => {
                toast.error(error.message)
                console.error('❌ Mutation failed! Error:', error);

                if(error.data?.code === 'FORBIDDEN'){
                    router.push('/upgrade')
                }
            }
        })
    )
    const updateMeeting = useMutation(
        trpc.meetings.update.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(
                    trpc.meetings.getMany.queryOptions({})
                );

                if(initialValues?.existingMeeting.id){
                    await queryClient.invalidateQueries(
                        trpc.meetings.getOne.queryOptions({id: initialValues.existingMeeting.id})
                    );
                }

                onSuccess?.()
            },
            onError: (error) => {
                toast.error(error.message)
            }
        })
    );

    const form = useForm<z.infer<typeof meetingsInsertSchema>>({
        resolver: zodResolver(meetingsInsertSchema),
        defaultValues: {
            name: initialValues?.existingMeeting.name ?? "",
            agentId: initialValues?.existingMeeting.agentId ?? "",
            // ensure isPublic is always present (boolean) to align with the schema type
            isPublic: initialValues?.existingMeeting.isPublic ?? false,
        }
    });

    const isEdit = !! initialValues?.existingMeeting.id;
    const isPending = createMeeting.isPending || updateMeeting.isPending;
   
    const onSubmit = (values: z.infer<typeof meetingsInsertSchema>) =>{
        console.log(' Form submitted with values:', values);
        if (isEdit) {
            updateMeeting.mutate({ ...values, id: initialValues.existingMeeting.id })
        } else {
            createMeeting.mutate(values);
        }
    };

    return (
        <>
            <NewAgentDialog open={openNewAgentDialog} onOpenChange={setOpenNewAgentDialog}/>
            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit as any)}>
                    <FormField
                        name="name"
                        control={form.control as any}
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g. Math Consultations" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        name='agentId'
                        control={form.control as any}
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Agent</FormLabel>
                                <FormControl>
                                    <CommandSelect
                                        options={(agents.data?.items ?? []).map((agent) => ({
                                            id: agent.id,
                                            value: agent.id,
                                            children: (
                                                <div className="flex items-center gap-x-2">
                                                    <GeneratedAvatarProp
                                                        seed={agent.name}
                                                        variant="botttsNeutral"
                                                        className="border size-6"
                                                    />
                                                    <span>{agent.name}</span>
                                                </div>
                                            )
                                        }))}
                                        onSelect={field.onChange}
                                        onSearch={setAgentSearch}
                                        value={field.value}
                                        palceholder="Select an agent"
                                    />
                                </FormControl>
                                <FormDescription>
                                    Not found what you&apos;re looking for{" "}
                                    <button
                                        type='button'
                                        className="text-primary hover:underline"
                                        onClick={() => setOpenNewAgentDialog(true)}
                                    >
                                        Create new
                                    </button>
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                
                    <div className="flex justify-between gap-x-2">
                        {onCancel && (
                            <Button
                                variant='ghost'
                                disabled={isPending}
                                type='button'
                                onClick={() => onCancel()}
                            >
                                Cancle
                            </Button>
                        )}
                        <Button
                            disabled={isPending}
                            type='submit'
                        >
                            {isEdit? "Update" : "Create"}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="isPublic">Public Meeting</Label>
                            <p className="text-sm text-muted-foreground">
                            Anyone with the link can join
                            </p>
                        </div>
                        <Switch
                            id="isPublic"
                            checked={form.watch("isPublic")}
                            onCheckedChange={(checked) => form.setValue("isPublic", checked)}
                        />
                    </div>
                </form>
            </Form>
        </>
    )

}