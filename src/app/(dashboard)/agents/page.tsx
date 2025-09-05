import { AgentsViewError, AgentsViewLoading, AgentView } from "@/modules/agents/ui/views/agents-views"
import { getQueryClient, trpc } from "@/trpc/server"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { ErrorBoundary } from "react-error-boundary"
// import { ErrorBoundary } from "next/dist/client/components/error-boundary"
import { Suspense } from "react"
import { AgentsListHeader } from "@/modules/agents/ui/components/list-header"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { SearchParams } from "nuqs"
import { loadSearchParams } from "@/modules/agents/params"



interface Props {
  searchParams: Promise<SearchParams>
}



async function page({ searchParams }: Props) { 

  const filters = await loadSearchParams(searchParams) 
  const session = await auth.api.getSession({ 
    headers: await headers(),
  })

  if(!session){ 
    redirect('/sign-in') 
  }

  const queryClient = getQueryClient()
  // void queryClient.prefetchQuery(trpc.agents.getOne.queryOptions({ id: params.id }))
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions({
    ...filters
  }));

  return (
    <>
      <AgentsListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<AgentsViewLoading />}>
          <ErrorBoundary fallback={<AgentsViewError />} >
            {/* <AgentView id={params.id} /> */}
            <AgentView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  )
}

export default page
