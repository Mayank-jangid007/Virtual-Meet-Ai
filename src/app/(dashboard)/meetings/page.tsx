
import { LoadingState } from "@/components/loading-state";
import { auth } from "@/lib/auth";
import { MeetingsListHeader } from "@/modules/meetings/ui/components/meetings-list-header";
import { MeetingView } from "@/modules/meetings/ui/view/meetings-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { loadSearchParams } from "@/modules/agents/params";
import type { SearchParams } from "nuqs/server";

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function Page({ searchParams }: Props) {
  const filters = await loadSearchParams(searchParams)
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/sign-in')
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.meetings.getMany.queryOptions({
      ...filters,
    })
  )

  return (
    <>
      <MeetingsListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<MeetingsViewLoading />}>
          <MeetingView />
        </Suspense>
      </HydrationBoundary>
    </>
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