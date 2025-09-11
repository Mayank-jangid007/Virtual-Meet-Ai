// import { createTRPCRouter, protectedProcedure } from "@/trpc/init"; 
// import {  Prisma, PrismaClient } from "@/generated/prisma";
// // import { agentsInsertSchema, agentsUpdateSchema } from "@/modules/agents/schemas";
// import { z } from "zod";
// import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
// import { TRPCError } from "@trpc/server";
// import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
// import { MeetingStatus } from "../types";

// const prisma = new PrismaClient()



// export const meetingsRouter = createTRPCRouter({
//     update: protectedProcedure
//     .input(meetingsUpdateSchema)
//     .mutation(async ({ ctx, input }) => {
//         const updatedMeeting = await prisma.meeting.update({
//             where:{
//                 id: input.id,
//                 userId: ctx.auth.user.id
//             },
//             data: input
//         })

//         if(!updatedMeeting){
//             throw new TRPCError({
//                 code: 'NOT_FOUND',
//                 message: 'Agent not found',
//             })
//         }

//         return updatedMeeting

//     }),
//     create: protectedProcedure
//     .input(meetingsInsertSchema)
//     .mutation(async ({input, ctx}) =>{
//         const  createdMeeting  = await prisma.meeting.create({
//             data: {
//                 // ...input,
//                 name: input.name,
//                 agentId: input.agentId,       // 👈 required
//                 userId: ctx.auth.user.id,
//             },
//             select: {
//               id: true,       // ✅ id return karna zaruri hai
//               name: true,
//               agentId: true,
//               userId: true,
//             },
//         })
//         return createdMeeting;
//     }),
//     getOne: protectedProcedure
//     .input(z.object({ id: z.string() }))
//     .query(async ({ input, ctx }) =>{
//         // const data = await prisma.agent.findMany({
//         const existingMeeting = await prisma.meeting.findUnique({
//             where: { id: input.id, userId: ctx.auth.user.id }, //   we are checking here ki this user ia author or creator using ctx.auth.user.id
//             include: {
//                 // _count: {
//                 //   select: { meetings: true },
//                 // },
//             },
//         });
        
//         if (!existingMeeting) {
//           throw new TRPCError({code: "NOT_FOUND", message: "Meeting not found"})
//         }
//         // const agentWithCount = {
//         //   ...existingMeeting,
//         //   meetingCount: existingMeeting._count.meetings, // flatten kar diya
//         // };
//     //   return agentWithCount;
//       return existingMeeting;
//     }),

//     //------

//     getMany: protectedProcedure
//     .input(
//         z.object({
//         page: z.number().default(DEFAULT_PAGE),
//         pageSize: z
//             .number()
//             .min(MIN_PAGE_SIZE)
//             .max(MAX_PAGE_SIZE)
//             .default(DEFAULT_PAGE_SIZE),
//         search: z.string().nullish(),
//         agentId: z.string().nullish(),
//         status: z.enum([
//             MeetingStatus.Upcoming,
//             MeetingStatus.Active,
//             MeetingStatus.Cancelled,
//             MeetingStatus.Processing,
//             MeetingStatus.Completed,
//         ]).nullish(),
//         })
//     )
//     .query(async ({ ctx, input }) => {
//         const { search, page, pageSize, status, agentId } = input;
        
//         const whereClause: Prisma.MeetingWhereInput  = {
//             userId: ctx.auth.user.id,
//             ...(search
//             ? {
//                 name: {
//                     contains: search,
//                     mode: "insensitive" as const, // case-insensitive search
//                 },
//                 }
//             : {}),
//             ...(agentId ? { agentId: agentId } : {}),
//             ...(status ? { status: status } : {}),
                
//         };
        
//         // run query + count in parallel
//         const [meetings, total] = await Promise.all([
//             prisma.meeting.findMany({
//                 where: whereClause,
//                 orderBy: [
//                     { createdAt: "desc" },
//                     { id: "desc" },
//                 ],
//                 skip: (page - 1) * pageSize, // ✅ offset
//                 take: pageSize,              // ✅ limit
//                 include: {
//                     agent: true, // include agent details (optional)
//                     user: true,  // include user details (optional)
//                 },
//             }),
        
//             prisma.meeting.count({ where: whereClause }),
//         ]);

//         const meetingsWithDuration = meetings.map(m => ({
//             ...m,
//             duration: m.endedAt && m.startedAt 
//               ? Math.floor((+m.endedAt - +m.startedAt) / 1000) // seconds
//               : null,
//           }));
            
//         return {
//             items: meetingsWithDuration,
//             total,
//             totalPages: Math.ceil(total / pageSize),
//         };
//     }),
// })

import { createTRPCRouter, protectedProcedure } from "@/trpc/init"; 
import {  Prisma, PrismaClient, MeetingStatus } from "@/generated/prisma"; // Import MeetingStatus from Prisma
import { z } from "zod";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
// Remove this import: import { MeetingStatus } from "../types";

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
        const existingMeeting = await prisma.meeting.findUnique({
            where: { id: input.id, userId: ctx.auth.user.id },
            include: {
                // _count: {
                //   select: { meetings: true },
                // },
            },
        });
        
        if (!existingMeeting) {
          throw new TRPCError({code: "NOT_FOUND", message: "Meeting not found"})
        }
      return existingMeeting;
    }),

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
        agentId: z.string().nullish(),
        status: z.nativeEnum(MeetingStatus).nullish(), // Use z.nativeEnum() for Prisma enums
        })
    )
    .query(async ({ ctx, input }) => {
        const { search, page, pageSize, status, agentId } = input;
        
        const whereClause: Prisma.MeetingWhereInput  = {
            userId: ctx.auth.user.id,
            ...(search
            ? {
                name: {
                    contains: search,
                    mode: "insensitive" as const,
                },
                }
            : {}),
            ...(agentId ? { agentId: agentId } : {}),
            ...(status ? { status: status } : {}), // This should now work correctly
                
        };
        
        // run query + count in parallel
        const [meetings, total] = await Promise.all([
            prisma.meeting.findMany({
                where: whereClause,
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" },
                ],
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    agent: true,
                    user: true,
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