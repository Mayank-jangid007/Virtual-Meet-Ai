"use client"

import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
 
import { useTRPC } from '@/trpc/client'
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { ResponseiveDialog } from '@/components/reponsive-dialog';
import { useState } from 'react';
import { AgentForm } from '../components/agents-forms';
import { Button } from '@/components/ui/button';


// interface AgentViewProps {
//     id: string
// }
  
// export const AgentView = ({ id }: AgentViewProps) => {
export const AgentView = () => {
  
    const trpc = useTRPC();
    // const { data, isLoading, isError } = useQuery(trpc.agents.getMany.queryOptions())
    // const { data } = useSuspenseQuery(trpc.agents.getOne.queryOptions({id}))
    const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions())
    const [onOpen, setOnOpen] = useState(true)
    console.log('--------data',data);
    console.log('--------hi from agent');

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
            <ResponseiveDialog title='Reponsive test' description='Reponsive description' open={onOpen} onOpenChange={setOnOpen}>
                <Button onClick={() => setOnOpen(false)}>
                   Some action 
                </Button>
                {/* <AgentForm onSuccess={() => setOnOpen(false)} onCancel={() => setOnOpen(false)}  /> */}
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
