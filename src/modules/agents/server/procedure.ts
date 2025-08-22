import { createTRPCRouter, baseProcedure } from "@/trpc/init"; 
import { PrismaClient } from "@/generated/prisma";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient()

export const agentsRouter = createTRPCRouter({
    getMany: baseProcedure.query(async () =>{
        const data = await prisma.agent.findMany()

        // await new Promise((resolve) => setTimeout(resolve, 5000))
        // throw new TRPCError({code: 'Bad_REQUEST'});

        return data;
    })
})