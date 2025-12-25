import { auth } from "@/lib/auth"
import SignInView from "@/modules/auth/ui/views/sign-in-view"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

async function SignIn() {
  // so we are not re-using this code in sign-in and sign-up page we can do this in layout or middleware page but there is an risk to do in this way
  const session = await auth.api.getSession({ // so this is how we can excess sessions on server side
    headers: await headers(),
  })

  if(!!session){ // if user logged in hai then redirect to home page
    redirect('/')
  }

  return <SignInView />
}

export default SignIn
