import { auth } from "@/lib/auth"
import SignUpView from "@/modules/auth/ui/views/sign-up-view" 
import { headers } from "next/headers"
import { redirect } from "next/navigation"

async function SignUp() {
    const session = await auth.api.getSession({ // so this is how we can excess sessions on server side
        headers: await headers(),
      })
    
      if(!!session){ // id session id true means true if session is null or undefined it will show false !! this will convert into true false 
        redirect('/')
      }
    
    
    return <SignUpView />
}

export default SignUp
