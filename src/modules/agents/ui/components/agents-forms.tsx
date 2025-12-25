import { useTRPC } from "@/trpc/client";
import { AgentGetOne } from "../types";
// import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { agentsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { GeneratedAvatarProp  } from '@/components/ui/generated_avatar'
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; 

import { 
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"; 
import { toast } from "sonner";



interface AgentFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: AgentGetOne;
}

export const AgentForm = ({
    onSuccess,
    onCancel,
    initialValues
}: AgentFormProps) =>{
    const trpc = useTRPC();
    // const router = useRouter();
    const queryClient = useQueryClient();

    const createAgent = useMutation( // “ In tRPC, useMutation is used with mutationOptions and useMutation executes a mutation request and manages its loading, success, and error states.”
        trpc.agents.create.mutationOptions({// In tRPC, mutationOptions gives us all the options related to a mutation — the endpoint to call, the input/output types, and success or error handlers.
            onSuccess: async () => { // when result comes and it  success then onSuccess callback run 
                await queryClient.invalidateQueries( // We use invalidateQueries(...) to refresh the list so that the new agent appears in the list
                    trpc.agents.getMany.queryOptions({})
                );
   

                onSuccess?.()
            },
            onError: (error) => {
                toast.error(error.message)
            }
        })
    )
    const updateAgent = useMutation( 
        trpc.agents.update.mutationOptions({ 
            onSuccess: async () => {
                await queryClient.invalidateQueries( 
                    trpc.agents.getMany.queryOptions({})
                );

                if(initialValues?.id){
                    await queryClient.invalidateQueries(
                        trpc.agents.getOne.queryOptions({id: initialValues.id})
                        // trpc.agents.getMany.queryOptions({})
                    );
                }

                onSuccess?.()
            },
            onError: (error) => {
                toast.error(error.message)
            }
        })
    )

    const form = useForm<z.infer<typeof agentsInsertSchema>>({
        resolver: zodResolver(agentsInsertSchema),
        defaultValues: {
            name: initialValues?.name ?? "",
            instructions: initialValues?.instructions ?? "",
        }
    });

    const isEdit = !! initialValues?.id;
    const isPending = createAgent.isPending || updateAgent.isPending;
   
    const onSubmit = (values: z.infer<typeof agentsInsertSchema>) =>{
        if (isEdit) {
            updateAgent.mutate({ ...values, id: initialValues.id }) // mutation means “Now send the request with this data. on the server”
        } else {
            createAgent.mutate (values);
        }
    };

    return (
        <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <GeneratedAvatarProp 
                    seed={form.watch('name')}
                    variant="botttsNeutral"
                    className="border size-16"
                />
                <FormField
                    name='name'
                    control={form.control}
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="e.g. Math tutor" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name='instructions'
                    control={form.control}
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Instructions</FormLabel>
                            <FormControl>
                                <Textarea {...field} placeholder="Your are a helpful math assistant that can answer questions and help with assignemnts" />
                            </FormControl>
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
    )

}