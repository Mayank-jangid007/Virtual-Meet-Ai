"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from 'next/navigation';

export default function Home() {
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { data: session } = authClient.useSession() 

  const router = useRouter()


  const onSubmit = async () => {
    // Basic validation
    if (!name.trim()) {
      alert('Name is required');
      return;
    }
    if (!email) {
      alert('Email is required');
      return;
    }
    if (!password) {
      alert('Password is required');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      await authClient.signUp.email({
        name: name,
        email: email,
        password: password,
      }, {
        onSuccess: () => {
          // redirect to the dashboard or sign in page
          alert('User created successfully!');
          // Optional: Reset form
          setName("");
          setEmail("");
          setPassword("");
        },
        onError: (ctx) => {
          // display the error message
          console.error('Sign up error:', ctx.error);
          alert(ctx.error.message);
        },
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }

  }
  const onLogin = async () =>{
    await authClient.signIn.email({
      email: email,
      password,
    }, {
      onSuccess: () => {
        // redirect to the dashboard or sign in page
        alert('User is logged in successfully!');
        // Optional: Reset form
        setEmail("");
        setPassword("");
      },
      onError: (ctx) => {
        // display the error message
        console.error('Sign in error:', ctx.error);
        alert(ctx.error.message);
      },
    });
  }
  
  if(session){
    return (
      <div>
        <p>Logged in as {session.user.name}</p>
        <Button onClick={() =>{
          authClient.signOut()
          router.push('/sign-in')
          }}>
          SignOut
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-3 p-5 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
        
        <Input 
          type="text"
          onChange={(e) => setName(e.target.value)} 
          value={name} 
          placeholder="Jon Doe"
          disabled={isLoading}
        />
        
        <Input 
          type="email"
          onChange={(e) => setEmail(e.target.value)} 
          value={email} 
          placeholder="jondoe@gmail.com"
          disabled={isLoading}
        />
        
        <Input 
          type="password"
          onChange={(e) => setPassword(e.target.value)} 
          value={password} 
          placeholder="*********"
          disabled={isLoading}
        />
        
        <Button 
          variant="default" 
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </div>
      <div className="grid gap-3 p-5 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      
      <Input 
        type="email"
        onChange={(e) => setEmail(e.target.value)} 
        value={email} 
        placeholder="jondoe@gmail.com"
        disabled={isLoading}
      />
      
      <Input 
        type="password"
        onChange={(e) => setPassword(e.target.value)} 
        value={password} 
        placeholder="*********"
        disabled={isLoading}
      />
      
      <Button 
        variant="default" 
        onClick={onLogin}
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </Button>
    </div>
  </div>
  );
}
