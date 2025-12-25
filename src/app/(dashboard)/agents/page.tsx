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

  // In Short we are doing => “prefetchQuery fetches the data in advance on the server.
  // dehydrate and HydrationBoundary transfer and re-hydrate that cached data on the client.
  // This results in faster rendering and type-safe data fetching when used with tRPC.”
  // Suspense loading UI handle karta hai agar data miss ho ya refetch ho raha ho.
  // ErrorBoundary graceful error UI deta hai agar fetch fail ho.

  
  // DETAIL IN SIMPLE LANGUAGE => 
  //  dehydrate(queryClient): server pe React Query cache ko JSON bana ke HTML ke saath client ko pack kar deta hai.
  // HydrationBoundary: client pe woh JSON cache wapas “rehydrate”(load) karke React Query ko de deta hai, taaki client ko same data mil jaye aur dubara fetch na karna pade (fast render, no flash).


  const queryClient = getQueryClient()
  // void queryClient.prefetchQuery(trpc.agents.getOne.queryOptions({ id: params.id }))
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions({ // so we are pre-fetching the agents.getMany data  in server component(means on the server) and fills the data in react-query cache
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
