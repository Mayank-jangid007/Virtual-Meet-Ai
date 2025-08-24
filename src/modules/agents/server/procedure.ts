import { createTRPCRouter, baseProcedure, protectedProcedure } from "@/trpc/init"; 
import { PrismaClient } from "@/generated/prisma";
// import { TRPCError } from "@trpc/server";
import { agentsInsertSchema } from "../schemas";
import { z } from "zod";

const prisma = new PrismaClient()



export const agentsRouter = createTRPCRouter({
    getOne: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) =>{
        const data = await prisma.agent.findUnique({
            where: { id: input.id },
        });
        // await new Promise((resolve) => setTimeout(resolve, 5000))
        // throw new TRPCError({code: 'Bad_REQUEST'});

        return data;
    }),
    getMany: protectedProcedure.query(async () => {
        const data = await prisma.agent.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return data;
    }),
    create: protectedProcedure
    .input(agentsInsertSchema)
    .mutation(async ({input, ctx}) =>{
        const  createdAgent  = await prisma.agent.create({
            data: {
                ...input,
                // userId: ctx.auth.user.id
                userId: ctx.userId
            }
        })
        return createdAgent;
    })
})