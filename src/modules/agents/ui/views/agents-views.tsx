"use client"

import { useSuspenseQuery } from '@tanstack/react-query'
 
import { useTRPC } from '@/trpc/client'
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { ResponseiveDialog } from '@/components/reponsive-dialog';
import { useState } from 'react';
// import { AgentForm } from '../components/agents-forms';
import { Button } from '@/components/ui/button';
import { columns } from '../components/columns';
import { EmptyState } from '@/components/empty-state';
import { useAgentsFilter } from '../../hooks/use-agents-filter';
import { DataPagination } from '../components/data-pagination';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/data-table';
     


export const AgentView = () => {
    const [filters, setFilters] = useAgentsFilter()
    const router = useRouter();
    const trpc = useTRPC();
    // const { data, isLoading, isError } = useQuery(trpc.agents.getMany.queryOptions())
    // const { data } = useSuspenseQuery(trpc.agents.getOne.queryOptions({id}))
    const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions({ // On the client side, inside AgentView, useSuspenseQuery first checks the cache. If the data is already there, it uses it immediately.If the data is not in the cache, it makes a network request. After hydration, the data is usually already in the cache, so no extra request is needed.”
        ...filters,
    }))
    const [onOpen, setOnOpen] = useState(true)

    return (
       <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
            <ResponseiveDialog title='Reponsive test' description='Reponsive description' open={onOpen} onOpenChange={setOnOpen}>
                <Button onClick={() => setOnOpen(false)}>
                   Some action 
                </Button>
                {/* <AgentForm onSuccess={() => setOnOpen(false)} onCancel={() => setOnOpen(false)}  /> */}
            </ResponseiveDialog>
           <DataTable
                data={data.items}
                columns={columns}
                onRowClick={(row) => router.push(`/agents/${row.id}`)} 
            />
           <DataPagination        
                page={filters.page}
                totalPage={data.totalPages}
                onPageChange={(page) => setFilters({ page })}
            />
           {data.items.length == 0 && (
                <EmptyState 
                    title='Create your first agent'
                    description='Create an agent to join your meetings. Each agent will follow your instructions and can interact with particiants during the call'
                />
           )}
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