import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { polarClient } from "@/lib/polar";
import { prisma } from "@/lib/prisma";

export const premiumRouter = createTRPCRouter({
    getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
        try {
            const customer = await polarClient.customers.getStateExternal({
                externalId: ctx.auth.user.id,
            });

            const subscription = customer.activeSubscriptions[0];
            if (!subscription) {
                return null;
            }
            const product = await polarClient.products.get({
                id: subscription.productId,
            });

            return product;
        } catch (error) {
            // Customer not found in Polar (common in sandbox) - treat as no subscription
            console.log('Polar customer not found, treating as free user:', ctx.auth.user.id);
            return null;
        }
    }),
    getProducts: protectedProcedure.query(async () => {
        const products = await polarClient.products.list({
            isArchived: false,
            isRecurring: true,
            sorting: ['price_amount']
        });

        return products.result.items;

    }),
    getFreeUsage: protectedProcedure.query(async ({ ctx }) => {
        try {
            const customer = await polarClient.customers.getStateExternal({
                externalId: ctx.auth.user.id,
            });

            const subscription = customer.activeSubscriptions[0];

            if (subscription) return null
        } catch (error) {
            // Customer not found in Polar - treat as free user
            console.log('Polar customer not found, returning free usage:', ctx.auth.user.id);
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

        // Calculate total AI agent usage across all meetings
        const meetings = await prisma.meeting.findMany({
            where: {
                userId: ctx.auth.user.id,
            },
            select: {
                agentTotalDuration: true,
            },
        });

        const totalAgentDurationSeconds = meetings.reduce(
            (sum, meeting) => sum + (meeting.agentTotalDuration || 0),
            0
        );
        const totalAgentDurationMinutes = Math.ceil(totalAgentDurationSeconds / 60);
        const AGENT_COST_PER_MINUTE = 0.10;
        const totalAgentCost = totalAgentDurationMinutes * AGENT_COST_PER_MINUTE;

        return {
            Meetingcount: userMeetings,
            AgentCount: userAgent,
            totalAgentDurationMinutes,
            totalAgentCost,
        };
    })
});