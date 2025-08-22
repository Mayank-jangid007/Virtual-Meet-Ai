import { auth } from "@/lib/auth";
// import { DashbaordSideBar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import { HomeView } from "@/modules/home/ui/views/home-views";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
// import { caller } from '@/trpc/server';

export default async function page() {

  // const data = await caller.hello({text: 'Mayank server'});
  //so here we are doing server-side call For API routes, SSR, middleware and authClient.getSession() and here we are doing client side call For React components, browser code in both we are doing same work

  const session = await auth.api.getSession({ // so this is how we can excess sessions on server side
    headers: await headers(),
  })

  if(!session){ // if user had dont logged in then it will redirected to sign-in page
    redirect('/sign-in') // if you log in and then sign-out thne this will not re-redirect to sign-in page becouse it will not actively look for session so for this signOut gives us an method
  }

  // return <p>{data.greeting}</p>

  return (
    <div>
      {/* <DashbaordSideBar /> */}
      <HomeView />
    </div>
  )
}
