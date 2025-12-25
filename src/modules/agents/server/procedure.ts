import { createTRPCRouter, protectedProcedure } from "@/trpc/init"; 
import { PrismaClient } from "@/generated/prisma";
import { agentsInsertSchema, agentsUpdateSchema } from "../schemas";
import { z } from "zod";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient()



export const agentsRouter = createTRPCRouter({
    update: protectedProcedure
    .input(agentsUpdateSchema)
    .mutation(async ({ ctx, input }) => { 
    // In ctx(context object) we are getting every user session means user id and more this will get protectedprocedure we build middleware in every protectedProcedure we get the user seesion
    // This ensures that only the logged-in user can update or delete their own agents.
    

        const updatedAgent = await prisma.agent.update({
            where:{
                id: input.id,
                userId: ctx.auth.user.id
            },
            data: input
        })

        if(!updatedAgent){
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Agent not found',
            })
        }

        return updatedAgent

    }),


    remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
        const removeAgent = await prisma.agent.delete({
            where: {
                id: input.id,
                userId: ctx.auth.user.id
            }
        })
        
        if(!removeAgent){
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Agent not found',
            })
        }

        return removeAgent

    }), 
    getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) =>{
        // const data = await prisma.agent.findMany({
        const existingAgent = await prisma.agent.findUnique({
            where: { id: input.id, userId: ctx.auth.user.id }, //   we are checking here ki this user ia author or creator using ctx.auth.user.id
            include: {
                _count: {
                  select: { meetings: true },
                },
            },
        });
        
        if (!existingAgent) {
          throw new TRPCError({code: "NOT_FOUND", message: "Agent not found"})
        }
        const agentWithCount = {
          ...existingAgent,
          meetingCount: existingAgent._count.meetings, // flatten kar diya
        };
      return agentWithCount;
    }),
    //------
    getMany: protectedProcedure
  .input(
    z.object({
      page: z.number().default(DEFAULT_PAGE),
      pageSize: z
        .number()
        .min(MIN_PAGE_SIZE)
        .max(MAX_PAGE_SIZE)
        .default(DEFAULT_PAGE_SIZE),
      search: z.string().nullish(),
    })
  )
  .query(async ({ ctx, input }) => {
    const { search, page, pageSize } = input;

    // build where clause
    const whereClause = {
      userId: ctx.auth.user.id,
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    // run query + count in parallel
    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where: whereClause,
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
        skip: (page - 1) * pageSize, // ✅ correct pagination
        take: pageSize,              // ✅ correct pagination
        include: {
          _count: {
            select: { meetings: true },
          },
        },
      }),

      prisma.agent.count({ where: whereClause }),
    ]);

    // format agents with meetingCount
    const items = agents.map(agent => ({
      ...agent,
      meetingCount: agent._count.meetings,
    }));

    return {
      items,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }),

    create: protectedProcedure
    .input(agentsInsertSchema)
    .mutation(async ({input, ctx}) =>{
        const  createdAgent  = await prisma.agent.create({
            data: {
                ...input,
                userId: ctx.auth.user.id
                // userId: ctx.userId
            }
        })
        return createdAgent;
    })
})