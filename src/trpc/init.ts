import { cache } from "react";
import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const createTRPCContext = cache (async () => {
return { userId: 'user_123' };
});

const t = initTRPC.create({

});


export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    console.log('SESSION:', session);
    if (session && session.user) {
        console.log('SESSION.USER:', session.user);
        console.log('SESSION.USER.ID:', session.user.id);
    }

    if (!session) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }
    if (!session.user || !session.user.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found in session' });
    }
    // yahan pe session ko context me add kar rahe hain
    return next({
        ctx: {
            ...ctx,
            auth: session,
            userId: session.user.id,
        }
    });
});

// const session = await auth.api.getSession({ // so this is how we can excess sessions on server side
//     headers: await headers(),
// })