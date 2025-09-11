import {
    CircleXIcon,
    CircleCheckIcon,
    ClockArrowUpIcon,
    VideoIcon,
    LoaderIcon, 
} from "lucide-react";

import { MEETING_STATUS_VALUES } from "../../types";
import { useMeetingsFilter} from "../../hooks/use-meetings-filter";
import { CommandSelect } from "@/components/command-select";

const options =[
    {
        id: MEETING_STATUS_VALUES.UPCOMING,
        value: MEETING_STATUS_VALUES.UPCOMING,
        children: (
            <div className="flex items-center gap-x-2 capitalize">
                <ClockArrowUpIcon />
                {MEETING_STATUS_VALUES.UPCOMING}
            </div>
        )
    },
    {
        id: MEETING_STATUS_VALUES.ACTIVE,
        value: MEETING_STATUS_VALUES.ACTIVE,
        children: (
            <div className="flex items-center gap-x-2 capitalize">
                <VideoIcon />
                {MEETING_STATUS_VALUES.ACTIVE}
            </div>
        )
    },
    {
        id: MEETING_STATUS_VALUES.COMPLETED,
        value: MEETING_STATUS_VALUES.COMPLETED,
        children: (
            <div className="flex items-center gap-x-2 capitalize">
                <CircleCheckIcon />
                {MEETING_STATUS_VALUES.COMPLETED}
            </div>
        )
    },
    {
        id: MEETING_STATUS_VALUES.PROCESSING,
        value: MEETING_STATUS_VALUES.PROCESSING,
        children: (
            <div className="flex items-center gap-x-2 capitalize">
                <LoaderIcon  />
                {MEETING_STATUS_VALUES.PROCESSING}
            </div>
        )
    },
    {
        id: MEETING_STATUS_VALUES.CANCELLED,
        value: MEETING_STATUS_VALUES.CANCELLED,
        children: (
            <div className="flex items-center gap-x-2 capitalize">
                <CircleXIcon  />
                {MEETING_STATUS_VALUES.CANCELLED}
            </div>
        )
    }
];

export const StatusFilter = () =>{
    const [filters, setFilters] = useMeetingsFilter();

    return (
        <CommandSelect
            palceholder="Status"
            className="h-9"
            options={options}
            value={filters.status ?? ""}
            onSelect={(value) => setFilters({ status: value as keyof typeof MEETING_STATUS_VALUES })}
            onSearch={() => {}} // Bhai, yeh required prop hai, toh blank function de diya
        />
    )
}