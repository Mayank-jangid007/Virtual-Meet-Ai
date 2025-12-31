import { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { MeetingStatus } from "@/generated/prisma";


// jitne bhi anne server pr mtlb procedure me endpoint bnae hai to usme jo bhi apnne return kr rhe hai thike to uska ye type bna deta hai taki jab apan client pr use kre to galat chees excess na kre jese list.item.id id ki jagah kuch or nhi or manle server pr change kiya to apan ko clientpr suggestion me ajaega
// inferRouterOutputs = tRPC ka helper jo server ke return types ko automatically nikalta hai (type infer karta hai).
// AppRouter ke andar jitne bhi procedures hain, un sab ke output types ka map bana deta hai.



export type MeetingGetMany = inferRouterOutputs<AppRouter>['meetings']['getMany']['items'];
export type MeetingGetOne = inferRouterOutputs<AppRouter>['meetings']['getOne'];
// export type MeetingGetOnee = inferRouterOutputs<AppRouter>['agents']['getOne'];
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
  } as const; // as const → make values readonly + exact banata hai (type narrowing).

export type StreamTranscriptItem = {
  speaker_id: string;
  type: string;
  text: string;
  start_ts: string;
  stop_ts: number;
}