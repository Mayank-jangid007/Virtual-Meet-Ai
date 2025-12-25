import { auth } from "@/lib/auth";
import { CallView } from "@/modules/call/ui/views/call-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface Props {
    params: Promise<{
        meetingid: string; 
    }>;
};

const Page = async ({ params }: Props) => {
    const { meetingid: meetingId } = await params;

    if (!meetingId) {
        redirect('/meetings');
    }

    const session = await auth.api.getSession({
        headers: await headers()
    });

    if(!session){
        redirect('/sign-in');
    }


    const queryClient = getQueryClient();
    try {
        await queryClient.prefetchQuery(
            trpc.meetings.getOne.queryOptions({ id: meetingId })
        );
    } catch (error) {
        // If meeting not found or unauthorized, redirect to meetings
        console.error('Failed to fetch meeting:', error);
        redirect('/meetings');
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CallView meetingId={meetingId} />
        </HydrationBoundary>
    )
}

export default Page