
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { meetingsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; 

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
   

                onSuccess?.(data.id)

                // if (data?.id) {
                //     router.push(`/meetings/${data.id}`);  // ✅ navigate after create
                // }
            },
            onError: (error) => {
                toast.error(error.message)
                console.error('❌ Mutation failed! Error:', error);
            }
        })
    )
    const updateMeeting = useMutation(
        trpc.meetings.update.mutationOptions({
            onSuccess: async () => {
                // yahan pe getMany ki jagah getAll use karo, kyunki getMany exist nahi karta
                await queryClient.invalidateQueries(
                    trpc.meetings.getMany.queryOptions({})
                );

                if(initialValues?.id){
                    await queryClient.invalidateQueries(
                        trpc.meetings.getOne.queryOptions({id: initialValues.id})
                        // trpc.agents.getMany.queryOptions({})
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
        resolver: zodResolver(meetingsInsertSchema ),
        defaultValues: {
            name: initialValues?.name ?? "",
            agentId: initialValues?.agentId ?? "",
        }
    });

    const isEdit = !! initialValues?.id;
    const isPending = createMeeting.isPending || updateMeeting.isPending;
   
    const onSubmit = (values: z.infer<typeof meetingsInsertSchema>) =>{
        console.log('🔘 Form submitted with values:', values);
        if (isEdit) {
            updateMeeting.mutate({ ...values, id: initialValues.id })
        } else {
            createMeeting.mutate(values);
        }
    };

    return (
        <>
            <NewAgentDialog open={openNewAgentDialog} onOpenChange={setOpenNewAgentDialog}/>
            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                
                    <FormField
                        name='name'
                        control={form.control}
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
                        control={form.control}
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
                </form>
            </Form>
        </>
    )

}

