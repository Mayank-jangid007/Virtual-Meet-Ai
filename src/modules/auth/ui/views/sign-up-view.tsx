"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { OctagonAlertIcon } from "lucide-react";
import { z } from 'zod'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form,  FormControl, FormField, FormItem,  FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaGithub, FaGoogle} from 'react-icons/fa'
import { useState } from 'react';

// the reason why we are making an saprate sign-in-view becouse we dont want ki all things are render on client side the logic render client side beocuse
// react events all are available on client side that's why we make saprate compoennt and ther father things are render on server side

const formSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1, { message: 'name is required' }),
    password: z.string().min(1, { message: 'Password is required' }),
    confirmPassword: z.string().min(1, { message: 'Password is required' })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

function SignUpView(){
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setPeding] = useState(false)

    // yahan pe form ko useForm ke andar initialize kar rahe hain, lekin problem yeh hai ki jab sign up hota hai, 
    // to session update nahi hota ya page reload nahi hota, isliye home page pe purana naam dikh raha hai.
    // Solution: sign up ke baad router.refresh() bhi call karo, taki session update ho jaye aur naya naam dikhe.

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    })

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setError(null)
        setPeding(true)
        authClient.signUp.email(
            {
                name: data.name,
                email: data.email,
                password: data.password,
                callbackURL: '/'
                // confirmPassword: data.confirmPassword
            },
            {
                onSuccess: () =>{
                    setPeding(false)
                    // yahan pe router.push('/') ke baad router.refresh() bhi call karo
                    router.push('/')
                    router.refresh() // yeh line add karo, taki session update ho jaye aur naya naam dikhe
                },
                onError: ({error}) =>{
                    setError(error.message)
                    setPeding(false)
                }
            }
        )
    }

    const onSocial = async (provider: 'github' | 'google') => {
        setError(null)
        setPeding(true)

        authClient.signIn.social(
            {
                provider: provider,
                callbackURL: '/'

            },
            {
                onSuccess: () =>{
                    setPeding(false)
                    // Social sign in ke baad bhi refresh kar do
                    router.push('/')
                    router.refresh()
                },
                onError: ({error}) =>{
                    setError(error.message)
                    setPeding(false)
                }
            }
        )
    }

    return( 
        <div className='h-full max-h-full '>
            <Card className="p-0 overflow-hidden">
                <CardContent className="grid md:grid-cols-2 p-0">
                    <Form {...form}>
                        <form className='p-6 md:p-8' onSubmit={form.handleSubmit(onSubmit)}>
                            <div className='flex flex-col gap-6'>
                                <div className='flex flex-col items-center text-center'>
                                    <h1 className='text-2xl font-bold text-balance'>Lest&apos;s get started</h1>
                                    <p className='text-muted-foreground'>Create your account</p>
                                </div>
                                <div className='grid gap-3'>
                                    <FormField
                                        control={form.control}
                                        name="name" 
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input type="text" placeholder="Joe Doe" {...field} disabled={isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className='grid gap-3'>
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="Joe@gmail.com" {...field} disabled={isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className='grid gap-3'>
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input type="Password" placeholder="********" {...field} disabled={isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className='grid gap-3'>
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm password</FormLabel>
                                                <FormControl>
                                                    <Input type="Text" placeholder="********" {...field} disabled={isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {!!error && ( // this will convert into boolean
                                    <Alert className='bg-destructive/10 border-none'>
                                        <OctagonAlertIcon className='h-4 w-4 !text-destructive' />
                                        <AlertTitle>{error}</AlertTitle>
                                    </Alert>
                                )}
                                <Button className='w-full' type='submit' disabled={isPending}>Sign up</Button>
                                <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
                                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                                        Or continue with
                                    </span>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    <Button
                                        variant='outline'
                                        type='button'
                                        className='w-full'
                                        disabled={isPending}
                                        onClick={() =>{
                                            onSocial('github')
                                        }}
                                    >
                                        <FaGithub />
                                    </Button>
                                      <Button
                                        variant='outline'
                                        type='button'
                                        className='w-full'
                                        disabled={isPending}
                                        onClick={() =>{
                                            onSocial('google')
                                        }}
                                    >  
                                        <FaGoogle /> 
                                    </Button>
                                </div>
                                <div className='flex flex-col items-center text-muted-foreground'>
                                        Already have an account?
                                        <Link href='/sign-in' className='underline underline-offset-4 text-muted-foreground hover:text-blue-300'>
                                            Sign in
                                        </Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                    <div className="bg-radial from-sidebar-accent to-sidebar relative hidden md:flex flex-col items-center justify-center gap-y-4"> {/*this relative hidden when apply's when screen size become small means phone seide and the div get hiddev md: means dekstop size*/}
                        <img src='/logo.svg' className="w-[92px] h-[92px]" />
                        <p className="text-2xl font-semibold text-white">
                            Meet.AI
                        </p>
                    </div>  
                </CardContent>
            </Card>
            <div className="text-muted-foreground : [a]:hover: text-primary text-center text-xs
                text-balance *:[a]: underline *:(a): underline-offset-4 m-1">
                By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a
                href="#">Privacy Policy</a>
            </div>
        </div>
    )

}

export default SignUpView
