import { createTRPCRouter, protectedProcedure } from "@/trpc/init"; 
import { PrismaClient } from "@/generated/prisma";
// import { TRPCError } from "@trpc/server";
import { agentsInsertSchema } from "../schemas";
import { z } from "zod";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";

const prisma = new PrismaClient()



export const agentsRouter = createTRPCRouter({
    getOne: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) =>{
        // const data = await prisma.agent.findMany({
        const data = await prisma.agent.findUnique({
            where: { id: input.id },
            include: {
                _count: {
                  select: { meetings: true },
                },
            },
        });

        
        if (!data) {
          return null;
        }
        const agentWithCount = {
          ...data,
          meetingCount: data._count.meetings, // flatten kar diya
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

    // getMany: protectedProcedure
    // .input(z.object({
    //     page: z.number().default(DEFAULT_PAGE),
    //     pageSize: z
    //     .number()
    //     .min(MIN_PAGE_SIZE)
    //     .max(MAX_PAGE_SIZE)
    //     .default(DEFAULT_PAGE_SIZE),
    //     search: z.string().nullish()
    // }))

    // .query(async ({ctx, input}) => {
    //     const { search, page, pageSize } = input;
        
    //     const data = await prisma.agent.findMany({
    //         orderBy: { createdAt: 'desc' },
    //         include: {
    //             _count: {
    //               select: { meetings: true },
    //             },
    //         },
    //     });
    //     await prisma.agent.findMany({
    //         where: {
    //             // userId: ctx.auth.session.id
    //             userId: ctx.auth.user.id,
    //             ...(search && {
    //                 name: {
    //                     contains: search,
    //                     mode: 'insensitive'
    //                 }
    //             })
    //         },
    //         orderBy: [
    //             { createdAt: "desc" },
    //             { id: "desc" },
    //         ],
    //         skip: (page - 1) * pageSize,
    //         take: pageSize,
    //     })
    //     const total = await prisma.agent.count({
    //         where: {
    //           userId: ctx.auth.user.id,
    //           ...(search
    //             ? {
    //                 name: {
    //                   contains: search,
    //                   mode: "insensitive",
    //                 },
    //               }
    //             : {}),
    //         },
    //       });

    //         const agents = data.map(agent => ({
    //             ...agent,
    //             meetingCount: agent._count.meetings,
    //         }));

          
    //       const totalPages = Math.ceil(total / pageSize);


          
    //         return {
    //             items: agents,
    //             total: total,
    //             totalPages
    //         }
    //         // return agents;

    // }),
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