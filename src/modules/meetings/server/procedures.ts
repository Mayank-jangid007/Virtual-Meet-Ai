import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import { Prisma, MeetingStatus } from "@/generated/prisma";
import { z } from "zod";
import JSONL from "jsonl-parse-stringify";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
import { GeneratedAvatarUri } from "@/lib/avatar";
import { streamVideo } from "@/lib/stream-video";
import { StreamTranscriptItem } from "../types";
import { streamChat } from "@/lib/stream-chat";
import { connectAgentToCall, disconnectAgentFromCall } from "./agent-helpers";
import { prisma } from "@/lib/prisma";

// Pricing configuration for agent usage
const AGENT_COST_PER_MINUTE = 0.10; // $0.10 per minute

export const meetingsRouter = createTRPCRouter({
  generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
    const token = streamChat.createToken(ctx.auth.user.id);
    await streamChat.upsertUser({
      id: ctx.auth.user.id,
      role: 'admin'
    })

    return token;
  }),

  getTranscript: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const existingMeeting = await prisma.meeting.findFirst({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        }
      })

      if (!existingMeeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        })
      }

      if (!existingMeeting.transcriptionUrl) {
        return [];
      }

      const transcript = await fetch(existingMeeting.transcriptionUrl)
        .then((res) => res.text())
        .then((text) => JSONL.parse<StreamTranscriptItem>(text))
        .catch(() => {
          return [];
        })

      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id))
      ]

      const users = await prisma.user.findMany({
        where: {
          id: {
            in: speakerIds,
          },
        },
      });

      const userSpeakers = users.map((user) => ({
        ...user,
        image:
          user.image ??
          GeneratedAvatarUri({
            seed: user.name as string,
            variant: "initials",
          }),
      }));

      const agent = await prisma.agent.findMany({
        where: {
          id: {
            in: speakerIds,
          },
        },
      });

      const agentSpeakers = agent.map((agent) => ({
        ...agent,
        image: GeneratedAvatarUri({
          seed: agent.name as string,
          variant: "botttsNeutral",
        }),
      }));

      const speakers = [...userSpeakers, ...agentSpeakers];

      const transcriptWithSpeakers = transcript.map((item) => {
        const speaker = speakers.find((speaker) => speaker.id === item.speaker_id)

        if (!speaker) {
          return {
            ...item,
            user: {
              name: 'Unknown',
              image: GeneratedAvatarUri({
                seed: 'Unknown',
                variant: 'initials'
              })
            }
          }
        }

        return {
          ...item,
          user: {
            name: speaker.name,
            image: speaker.image
          }
        }
      })

      return transcriptWithSpeakers;
    }),

  generateToken: protectedProcedure.query(async ({ ctx }) => {
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
    });

    return {
      token,
      user: {
        id: ctx.auth.user.id,
        name: ctx.auth.user.name,
        image: ctx.auth.user.image ??
          GeneratedAvatarUri({ seed: ctx.auth.user.name, variant: 'initials' })
      }
    };
  }),

  // ✅ REMOVED DUPLICATE - Keep only one remove procedure
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // first ensure the meeting exists and belongs to the user
      const meeting = await prisma.meeting.findFirst({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });

      if (!meeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      // delete by id (id is unique)
      const removedMeeting = await prisma.meeting.delete({
        where: { id: input.id },
      });

      return removedMeeting;
    }),

  // ✅ REMOVED DUPLICATE - Keep only one update procedure
  update: protectedProcedure
    .input(meetingsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      // ensure the meeting exists and belongs to the user first
      const meeting = await prisma.meeting.findFirst({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });

      if (!meeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      const updatedMeeting = await prisma.meeting.update({
        where: {
          id: input.id,
        },
        data: input
      })

      return updatedMeeting
    }),

  create: premiumProcedure('meetings')
    .input(meetingsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const createdMeeting = await prisma.meeting.create({
        data: {
          name: input.name,
          agentId: input.agentId,
          userId: ctx.auth.user.id,
          isPublic: input.isPublic ?? false
        },
        select: {
          id: true,
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
            transcription: {
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
      ]);

      console.log('✅ Meeting and call created, agent will connect when user joins (via webhook)');
      return createdMeeting;
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // fetch by id so non-hosts (invited users) can view meeting info
      const existingMeeting = await prisma.meeting.findUnique({
        where: { id: input.id },
        include: { agent: true },
      });

      if (!existingMeeting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" });
      }

      const duration =
        existingMeeting.endedAt && existingMeeting.startedAt
          ? Math.floor(
            (existingMeeting.endedAt.getTime() - existingMeeting.startedAt.getTime()) / 1000
          )
          : null;

      return { existingMeeting, duration };
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
        status: z.nativeEnum(MeetingStatus).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize, status, agentId } = input;

      const whereClause: Prisma.MeetingWhereInput = {
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
        ...(status ? { status: status } : {}),
      };

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
          ? Math.floor((+m.endedAt - +m.startedAt) / 1000)
          : null,
      }));

      return {
        items: meetingsWithDuration,
        total,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  inviteParticipants: protectedProcedure
    .input(
      z.object({
        meetingId: z.string(),
        emails: z.array(z.string().email()).min(1).max(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const meeting = await prisma.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId: ctx.auth.user.id,
        },
      });

      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found or you're not the host",
        });
      }

      if (meeting.maxParticipants) {
        const currentParticipants = await prisma.meetingParticipant.count({
          where: { meetingId: input.meetingId, leftAt: null },
        });

        if (currentParticipants + input.emails.length > meeting.maxParticipants) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Meeting is limited to ${meeting.maxParticipants} participants`,
          });
        }
      }

      const invitations = await prisma.$transaction(
        input.emails.map((email) =>
          prisma.meetingInvitation.upsert({
            where: {
              meetingId_email: {
                meetingId: input.meetingId,
                email: email.toLowerCase(),
              },
            },
            create: {
              meetingId: input.meetingId,
              email: email.toLowerCase(),
              invitedBy: ctx.auth.user.id,
              status: "PENDING",
            },
            update: {
              status: "PENDING",
              sentAt: new Date(),
            },
          })
        )
      );

      return invitations;
    }),

  canJoinMeeting: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await prisma.meeting.findUnique({
        where: { id: input.meetingId },
        include: {
          invitations: {
            where: {
              email: ctx.auth.user.email.toLowerCase(),
              status: "PENDING"
            },
            take: 1  // Only need to know if user has invitation
          },
          _count: {
            select: {
              participants: {
                where: { leftAt: null }
              }
            }
          }
        },
      });

      if (!meeting) {
        return { canJoin: false, reason: "Meeting not found" };
      }

      if (meeting.userId === ctx.auth.user.id) {
        return { canJoin: true, role: "HOST" as const };
      }

      if (
        meeting.maxParticipants &&
        meeting._count.participants >= meeting.maxParticipants
      ) {
        return { canJoin: false, reason: "Meeting is full" };
      }

      if (meeting.isPublic) {
        return { canJoin: true, role: "PARTICIPANT" as const };
      }

      if (meeting.invitations.length > 0) {
        return { canJoin: true, role: "PARTICIPANT" as const };
      }

      return { canJoin: false, reason: "You need an invitation to join" };
    }),

  joinMeeting: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const canJoinResult = await prisma.meeting.findUnique({
        where: { id: input.meetingId },
        include: {
          invitations: true,
          participants: { where: { leftAt: null } },
        },
      });

      if (!canJoinResult) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      const isHost = canJoinResult.userId === ctx.auth.user.id;
      const isPublic = canJoinResult.isPublic;
      const hasInvitation = canJoinResult.invitations.some(
        (inv) =>
          inv.email.toLowerCase() === ctx.auth.user.email.toLowerCase() &&
          inv.status === "PENDING"
      );

      if (!isHost && !isPublic && !hasInvitation) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You're not authorized to join this meeting",
        });
      }

      const existingParticipant = await prisma.meetingParticipant.findUnique({
        where: {
          meetingId_userId: {
            meetingId: input.meetingId,
            userId: ctx.auth.user.id,
          },
        },
      });

      if (existingParticipant) {
        await prisma.meetingParticipant.update({
          where: { id: existingParticipant.id },
          data: { leftAt: null, joinedAt: new Date() },
        });
      } else {
        await prisma.meetingParticipant.create({
          data: {
            meetingId: input.meetingId,
            userId: ctx.auth.user.id,
            role: isHost ? "HOST" : "PARTICIPANT",
          },
        });
      }

      if (hasInvitation) {
        await prisma.meetingInvitation.updateMany({
          where: {
            meetingId: input.meetingId,
            email: ctx.auth.user.email.toLowerCase(),
          },
          data: { status: "ACCEPTED" },
        });
      }

      await streamVideo.upsertUsers([
        {
          id: ctx.auth.user.id,
          name: ctx.auth.user.name,
          role: "user",
          image:
            ctx.auth.user.image ??
            GeneratedAvatarUri({
              seed: ctx.auth.user.name,
              variant: "initials",
            }),
        },
      ]);

      return { success: true };
    }),

  leaveMeeting: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Update participant leave time
      await prisma.meetingParticipant.updateMany({
        where: {
          meetingId: input.meetingId,
          userId: ctx.auth.user.id,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
        },
      });

      // ✅ Auto-disconnect agent if host leaves with active agent
      try {
        const meeting = await prisma.meeting.findUnique({
          where: { id: input.meetingId },
          select: {
            userId: true,           // Meeting creator (host)
            agentActive: true,      // Is agent currently active?
          },
        });

        if (meeting) {
          const isHost = meeting.userId === ctx.auth.user.id;
          const agentIsActive = meeting.agentActive === true;

          if (isHost && agentIsActive) {
            console.log('🤖 Host is leaving with active agent, auto-disconnecting...');

            await disconnectAgentFromCall(
              input.meetingId
            );

            console.log('✅ Agent auto-disconnected successfully');
          }
        }
      } catch (error) {
        // Log error but don't block user from leaving
        console.error('❌ Failed to auto-disconnect agent:', error);
      }

      return { success: true };
    }),

  getParticipants: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = await prisma.meetingParticipant.findMany({
        where: {
          meetingId: input.meetingId,
          leftAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      });

      return participants.map((p) => ({
        id: p.id,
        role: p.role,
        joinedAt: p.joinedAt,
        user: {
          ...p.user,
          image:
            p.user.image ??
            GeneratedAvatarUri({
              seed: p.user.name || "User",
              variant: "initials",
            }),
        },
      }));
    }),

  getInvitations: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await prisma.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId: ctx.auth.user.id,
        },
      });

      if (!meeting) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the host can view invitations",
        });
      }

      return await prisma.meetingInvitation.findMany({
        where: { meetingId: input.meetingId },
        orderBy: { sentAt: "desc" },
      });
    }),


  // agent switch


  toggleAgent: protectedProcedure
    .input(z.object({ meetingId: z.string(), enable: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // First, get the meeting to check ownership
      const meeting = await prisma.meeting.findUnique({
        where: { id: input.meetingId },
        include: { agent: true }
      });

      if (!meeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found'
        });
      }

      // Check if user is the meeting owner (creator)
      const isOwner = meeting.userId === ctx.auth.user.id;

      // If not owner, check if they're a HOST or CO_HOST in the participant table
      if (!isOwner) {
        const participant = await prisma.meetingParticipant.findUnique({
          where: {
            meetingId_userId: {
              meetingId: input.meetingId,
              userId: ctx.auth.user.id,
            }
          }
        });

        if (!participant || (participant.role !== 'HOST' && participant.role !== 'CO_HOST')) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the host or co-host can toggle the agent",
          });
        }
      }

      if (input.enable) {
        if (meeting.agentActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Agent is already active'
          })
        }

        const result = await connectAgentToCall(
          meeting.id,
          meeting.agent.id,
          meeting.agent.name,
          meeting.agent.instructions
        )

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'Failed to connect agent'
          })
        }

        await prisma.meeting.update({
          where: { id: input.meetingId },
          data: {
            agentActive: true,
            agentConnectedAt: new Date()
          }
        })


        console.log('✅ Agent enabled for meeting:', input.meetingId);

        return { success: true, agentActive: true };
      } else {

        if (!meeting.agentActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Agent is not currently active'
          })
        }

        console.log('🔌 Attempting to disconnect agent:', meeting.agent.id);
        const result = await disconnectAgentFromCall(
          input.meetingId
        )

        if (!result.success) {
          console.error('❌ Disconnect failed:', result.error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || 'Failed to disconnect agent'
          })
        }

        const connectedAt = meeting.agentConnectedAt;
        const disconnectedAt = new Date();
        // FIX: Calculate duration correctly (disconnectedAt - connectedAt, not the reverse!)
        const durationSeconds = connectedAt
          ? Math.floor((disconnectedAt.getTime() - connectedAt.getTime()) / 1000)
          : 0;

        console.log('⏱️ Agent session duration:', durationSeconds, 'seconds');

        await prisma.meeting.update({
          where: { id: input.meetingId },
          data: {
            agentActive: false,
            agentDisconnectedAt: disconnectedAt,
            agentTotalDuration: {
              increment: durationSeconds
            }
          }
        })

        console.log('✅ Agent disabled for meeting:', input.meetingId);
        console.log('📊 Total duration now:', (meeting.agentTotalDuration || 0) + durationSeconds, 'seconds');

        return { success: true, agentActive: false, durationSeconds }

      }

    }),

  // this will give the current or real time time duration of the agent duration time meansyou will only see duration time when agent get disconnected but if want agent id going on not diconnected then we want the total duration time then
  getAgentStatus: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {

      const meeting = await prisma.meeting.findUnique({
        where: { id: input.meetingId },
        select: {
          agentActive: true,
          agentConnectedAt: true,
          agentTotalDuration: true
        }
      })

      if (!meeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found'
        })
      }

      let currentSessionDuration = 0;
      if (meeting.agentActive && meeting.agentConnectedAt) {
        currentSessionDuration = Math.floor((new Date().getTime() - meeting.agentConnectedAt.getTime()) / 1000)
      }

      // this will give the total duration time means the some of previous agent duration time plus currently agent duration time 
      const totalDuration = (meeting.agentTotalDuration || 0) + currentSessionDuration;

      return {
        isActive: meeting.agentActive,
        duration: totalDuration
      }

    }),


  // Get billing information for a meeting (only for free users)
  getMeetingBilling: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get meeting with agent duration
      const meeting = await prisma.meeting.findUnique({
        where: { id: input.meetingId },
        select: {
          id: true,
          agentTotalDuration: true,
          userId: true,
        }
      });

      if (!meeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found'
        });
      }

      // Check if user is the meeting owner
      if (meeting.userId !== ctx.auth.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only meeting owner can view billing'
        });
      }

      // Check if user is premium (from context set by premiumProcedure)
      // For now, we'll check if they have any active subscription
      // You can enhance this by checking ctx.isPremium if available
      const isPremium = false; // TODO: Get from ctx or check subscription

      // If premium, don't show billing
      if (isPremium) {
        return {
          showBilling: false,
          message: 'Billing included in your subscription'
        };
      }

      // Calculate billing for free users
      const durationInSeconds = meeting.agentTotalDuration || 0;
      const durationInMinutes = Math.ceil(durationInSeconds / 60); // Round up to nearest minute
      const totalCost = durationInMinutes * AGENT_COST_PER_MINUTE;

      return {
        showBilling: true,
        agentDurationSeconds: durationInSeconds,
        agentDurationMinutes: durationInMinutes,
        costPerMinute: AGENT_COST_PER_MINUTE,
        totalCost: totalCost,
        currency: 'USD'
      };
    })
})


