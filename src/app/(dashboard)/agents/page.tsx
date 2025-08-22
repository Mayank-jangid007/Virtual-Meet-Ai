import { AgentsViewError, AgentsViewLoading, AgentView } from "@/modules/agents/ui/views/agents-views"
import { getQueryClient, trpc } from "@/trpc/server"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { ErrorBoundary } from "react-error-boundary"
// import { ErrorBoundary } from "next/dist/client/components/error-boundary"
import { Suspense } from "react"

function page() {

  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(trpc.agetns.getMany.queryOptions())

  return (
    <div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<AgentsViewLoading />}>
          <ErrorBoundary fallback={<AgentsViewError />} >
            <AgentView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </div>
  )
}

export default page
