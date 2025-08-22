"use client"

import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
 
import { useTRPC } from '@/trpc/client'
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { ResponseiveDialog } from '@/components/reponsive-dialog';
import { Button } from '@/components/ui/button';

export const AgentView = () => {
    const trpc = useTRPC();
    // const { data, isLoading, isError } = useQuery(trpc.agetns.getMany.queryOptions())
    const { data } = useSuspenseQuery(trpc.agetns.getMany.queryOptions())

    // if(isLoading){
    //     return <div>
    //         <LoadingState 
    //             title='Loading Agents'
    //             description='This may take a few seconds'
    //         />
    //     </div>
    // }


    // if(isError){
    //     return(
    //         <div>
    //             <ErrorState 
    //                 title='Error loading Agents'
    //                 description='Please try again later'
    //             />
    //         </div>
    //     )
    // }

    return (
       <div>
            <ResponseiveDialog title='Reponsive test' description='Reponsive description' open onOpenChange={() => {}}>
                <Button>
                   Some action 
                </Button>
            </ResponseiveDialog>
            {JSON.stringify(data, null, 2)}
       </div> 
    )

    
}

export function AgentsViewLoading() {
    return <div>
             <LoadingState 
                title='Loading Agents'
                description='This may take a few seconds'
            />
        </div>
}
export function AgentsViewError() {
    return  <div>
                 <ErrorState 
                    title='Error loading Agents'
                    description='Please try again later'
                />
            </div>
}
