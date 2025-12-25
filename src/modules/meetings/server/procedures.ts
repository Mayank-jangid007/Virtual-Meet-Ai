

import { createTRPCRouter, protectedProcedure } from "@/trpc/init"; 
import {  Prisma, PrismaClient, MeetingStatus } from "@/generated/prisma"; // Import MeetingStatus from Prisma
import { z } from "zod";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
import { GeneratedAvatarUri } from "@/lib/avatar";
import { streamVideo } from "@/lib/stream-video";
// Remove this import: import { MeetingStatus } from "../types";

const prisma = new PrismaClient()

export const meetingsRouter = createTRPCRouter({

    generateToken: protectedProcedure.mutation(async ({ ctx }) => {
        await streamVideo.upsertUsers([
            {
                id: ctx.auth.user.id,
                name: ctx.auth.user.name,
                role: 'admin',
                image: 
                ctx.auth.user.image ?? 
                GeneratedAvatarUri({ seed: ctx.auth.user.name, variant: 'initials' })
            }
        ]);

        const expirationTime = Math.floor(Date.now() / 1000) + 3600;
        const issuedAt = Math.floor(Date.now() / 1000) - 60;

        const token = streamVideo.generateUserToken({
            user_id: ctx.auth.user.id,
            exp: expirationTime,
            validity_in_seconds: issuedAt,
        })

        return token
    }),

    remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
        const removeMeeting = await prisma.meeting.delete({
            where:{
                id: input.id,
                userId: ctx.auth.user.id
            }
        })

        if(!removeMeeting){
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Agent not found',
            })
        }

        return removeMeeting

    }),
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

        const call = streamVideo.video.call("default", createdMeeting.id)
        await call.create({
            data: {
                created_by_id: ctx.auth.user.id,
                custom: {
                    meetingId: createdMeeting.id,
                    meetingName: createdMeeting.name
                },
                settings_override: {
                    transcription:{
                        language: 'en',
                        mode: 'auto-on',
                        closed_caption_mode: 'auto-on'
                    },
                    recording: {
                        mode: 'auto-on',
                        quality: '1080p',      
                    }
                }
            }
        });

        const existingAgent = await prisma.agent.findUnique({
            where: { 
              id: createdMeeting.agentId 
            }
          });
          
          if (!existingAgent) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Agent not found",
            });
          }

          await streamVideo.upsertUsers([
            {
                id: existingAgent.id,
                name: existingAgent.name,
                role: 'user',
                image: GeneratedAvatarUri({
                    seed: existingAgent.name,
                    variant: 'botttsNeutral'
                })
            }
          ])

        return createdMeeting;
    }),
    getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) =>{
        const existingMeeting = await prisma.meeting.findUnique({
            where: { id: input.id, userId: ctx.auth.user.id },
            include: { agent: true, },
        });
        
        if (!existingMeeting) {
          throw new TRPCError({code: "NOT_FOUND", message: "Meeting not found"})
        }

        const duration = existingMeeting.endedAt && existingMeeting.startedAt
        ? Math.floor(
            (existingMeeting.endedAt.getTime() -
              existingMeeting.startedAt.getTime()) /
              1000
          )
        : null;

      return {existingMeeting, duration};
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