import { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { MeetingStatus } from "@/generated/prisma";

export type MeetingGetMany = inferRouterOutputs<AppRouter>['meetings']['getMany']['items'];
export type MeetingGetOne = inferRouterOutputs<AppRouter>['meetings']['getOne'];
// export enum MeetingStatus {
//     Upcoming = 'UPCOMING',
//     Active = 'ACTIVE',
//     Completed = 'COMPLETED',
//     Processing = 'PROCESSING',
//     Cancelled = 'CANCELLED',
// }

export const MEETING_STATUS_VALUES = {
    UPCOMING: MeetingStatus.UPCOMING,
    ACTIVE: MeetingStatus.ACTIVE,
    COMPLETED: MeetingStatus.COMPLETED,
    PROCESSING: MeetingStatus.PROCESSING,
    CANCELLED: MeetingStatus.CANCELLED,
  } as const;