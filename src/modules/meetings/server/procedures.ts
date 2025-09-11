import { createTRPCRouter, protectedProcedure } from "@/trpc/init"; 
import {  PrismaClient } from "@/generated/prisma";
// import { agentsInsertSchema, agentsUpdateSchema } from "@/modules/agents/schemas";
import { z } from "zod";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";

const prisma = new PrismaClient()



export const meetingsRouter = createTRPCRouter({
    update: protectedProcedure
    .input(meetingsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
        const updatedMeeting = await prisma.meeting.update({
            where:{
                id: input.id,
                userId: ctx.auth.user.id
            },
            data: input
        })

        if(!updatedMeeting){
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Agent not found',
            })
        }

        return updatedMeeting

    }),
    create: protectedProcedure
    .input(meetingsInsertSchema)
    .mutation(async ({input, ctx}) =>{
        const  createdMeeting  = await prisma.meeting.create({
            data: {
                // ...input,
                name: input.name,
                agentId: input.agentId,       // 👈 required
                userId: ctx.auth.user.id,
            },
            select: {
              id: true,       // ✅ id return karna zaruri hai
              name: true,
              agentId: true,
              userId: true,
            },
        })
        return createdMeeting;
    }),
    getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) =>{
        // const data = await prisma.agent.findMany({
        const existingMeeting = await prisma.meeting.findUnique({
            where: { id: input.id, userId: ctx.auth.user.id }, //   we are checking here ki this user ia author or creator using ctx.auth.user.id
            include: {
                // _count: {
                //   select: { meetings: true },
                // },
            },
        });
        
        if (!existingMeeting) {
          throw new TRPCError({code: "NOT_FOUND", message: "Meeting not found"})
        }
        // const agentWithCount = {
        //   ...existingMeeting,
        //   meetingCount: existingMeeting._count.meetings, // flatten kar diya
        // };
    //   return agentWithCount;
      return existingMeeting;
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
        
        // throw new TRPCError({ code: 'BAD_REQUEST' })

        // build where clause
        const whereClause = {
            userId: ctx.auth.user.id,
            ...(search
            ? {
                name: {
                    contains: search,
                    mode: "insensitive" as const, // case-insensitive search
                },
                }
            : {}),
        };
        
        // run query + count in parallel
        const [meetings, total] = await Promise.all([
            prisma.meeting.findMany({
                where: whereClause,
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" },
                ],
                skip: (page - 1) * pageSize, // ✅ offset
                take: pageSize,              // ✅ limit
                include: {
                    agent: true, // include agent details (optional)
                    user: true,  // include user details (optional)
                },
            }),
        
            prisma.meeting.count({ where: whereClause }),
        ]);

        const meetingsWithDuration = meetings.map(m => ({
            ...m,
            duration: m.endedAt && m.startedAt 
              ? Math.floor((+m.endedAt - +m.startedAt) / 1000) // seconds
              : null,
          }));
            
        return {
            items: meetingsWithDuration,
            total,
            totalPages: Math.ceil(total / pageSize),
        };
    }),
})