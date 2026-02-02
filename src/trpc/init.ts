import { cache } from "react";
import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { polarClient } from "@/lib/polar";
import { PrismaClient } from "@/generated/prisma";
import { MAX_FREEE_AGENTS, MAX_FREEE_MEETINGS } from "@/modules/premium/constant";
import { prisma } from "@/lib/prisma";

// “This file acts as the core setup for tRPC. It defines the router creator, a base procedure, 
// and an auth-protected procedure. All other feature routers, such as agents and meetings, build their endpoints using these shared utilities.”

export const createTRPCContext = cache(async () => {
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

export const premiumProcedure = (entity: "meetings" | "agents") =>
    protectedProcedure.use(async ({ ctx, next }) => {
        let isPremium = false;

        // Try to get customer from Polar, but don't fail if not found
        try {
            const customer = await polarClient.customers.getStateExternal({
                externalId: ctx.auth.user.id,
            });
            isPremium = customer.activeSubscriptions.length > 0;
        } catch (error) {
            // Customer not found in Polar - treat as free user
            console.log('Polar customer not found in premiumProcedure, treating as free user:', ctx.auth.user.id);
            isPremium = false;
        }

        const userMeetings = await prisma.meeting.count({
            where: {
                userId: ctx.auth.user.id,
            },
        });

        const userAgent = await prisma.agent.count({
            where: {
                userId: ctx.auth.user.id,
            },
        });

        const isFreeAgentLimitReached = userAgent >= MAX_FREEE_AGENTS;
        const isFreeMeetingLimitReached = userMeetings >= MAX_FREEE_MEETINGS;
        const shouldThrowMeetingError = entity === "meetings" && isFreeMeetingLimitReached && !isPremium;
        const shouldThrowAgentError = entity === "agents" && isFreeAgentLimitReached && !isPremium;


        if (shouldThrowMeetingError) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You have reached the maximum number of free meetings",
            });
        }
        if (shouldThrowAgentError) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You have reached the maximum number of free agents",
            });
        }

        return next({ ctx: { ...ctx, customer: null } })
    })