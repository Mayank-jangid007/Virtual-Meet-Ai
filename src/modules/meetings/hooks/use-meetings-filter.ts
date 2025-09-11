import  { parseAsInteger, parseAsString, useQueryStates, parseAsStringEnum } from 'nuqs'
import { DEFAULT_PAGE } from '@/constants'

import { MEETING_STATUS_VALUES } from '../types'
// import { MeetingStatus } from '@/generated/prisma'

export const useMeetingsFilter = () => {
    return useQueryStates({
        search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }), // so withDefault mean when emty strings comes then dont show like thishttp://localhost:3002/agents?search= this look weirdo if empty strings comes then it shows this http://localhost:3002/agents
        page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({ clearOnDefault: true }),
        agentId: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
        status: parseAsStringEnum(Object.values(MEETING_STATUS_VALUES))
    })
} 

// claude pr jake teri project ki pdf share krdegna pr trpc ka puchlena 