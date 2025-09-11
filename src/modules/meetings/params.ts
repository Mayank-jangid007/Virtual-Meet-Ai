import  { createLoader, parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs/server'

import { DEFAULT_PAGE } from '@/constants'

import { MEETING_STATUS_VALUES } from './types'

export const filtersSearchParams = { // this is for server component
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }), // so withDefault mean when emty strings comes then dont show like thishttp://localhost:3002/agents?search= this look weirdo if empty strings comes then it shows this http://localhost:3002/agents
    page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({ clearOnDefault: true }),
    status: parseAsStringEnum(Object.values(MEETING_STATUS_VALUES)),
    agentId: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
}

export const loadSearchParams = createLoader(filtersSearchParams)
  