
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { MeetingView } from "@/modules/meetings/ui/view/meetings-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";

export default function Page() {

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.meetings.getMany.queryOptions({})
  )

  return (
    <div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<MeetingsViewLoading />}>
          {/* <ErrorBoundary errorComponent={MeetingsViewError}> */}
          <ErrorBoundary fallback={<MeetingsViewError />}>
            <MeetingView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </div>
  )
}



export function MeetingsViewLoading() {
  return <div>
           <LoadingState
              title='Loading Meetings'
              description='This may take a few seconds'
          />
      </div>
}
export function MeetingsViewError() {
  return  <div>
              <ErrorState
                  title='Error loading Meetings'
                  description='Please try again later'
              />
          </div>
}