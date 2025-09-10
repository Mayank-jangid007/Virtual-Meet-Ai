"use client"

import { useTRPC } from "@/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"

export const MeetingView = () =>{

    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.meetings.getMany.queryOptions({}))

    return (
        <div className="overflow-x-scroll">
            {JSON.stringify(data)}
            
        </div>
    )

}



