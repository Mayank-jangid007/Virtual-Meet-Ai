"use client"

import { Button } from "@/components/ui/button" 
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
 

export function HomeView() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // yahan pe async function bana ke session fetch kar rahe hain
    const fetchSession = async () => {
      const { data: session } = await authClient.getSession()
      setSession(session)
      setLoading(false)
    }
    fetchSession()
  }, [])

  if (loading) {
    return <h1>Loading....</h1>
  }
  if (!session) {
    return <h1>No session found. Please login.</h1>
  }

  return (
    <div>
      <h1>Logged in as {session.user.name}</h1>
      <Button onClick={() => authClient.signOut({
        fetchOptions: {
          onSuccess: () => router.push('/sign-in')
        }
      })}>
        Sign Out
      </Button>
    </div>
  )
}


