import Link from "next/link";
import { RocketIcon, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import {
    MAX_FREEE_AGENTS,
    MAX_FREEE_MEETINGS
} from "@/modules/premium/constant";

export const DashboardTrial = () => {
    const trpc = useTRPC();
    const { data } = useQuery({
        ...trpc.premium.getFreeUsage.queryOptions(),
        refetchInterval: 10000, // Refetch every 10 seconds to show updated AI usage
    });

    if (!data) return null;
    return (
        <div className="border border-border/10 rounded-lg w-full bg-white/5 flex flex-col gap-y-2">
            <div className="p-3 flex flex-col gap-y-4">
                <div className="flex items-center gap-2">
                    <RocketIcon className="size-4" />
                    <p className="text-sm font-medium">Free Trial</p>
                </div>
                <div className="flex flex-col gap-y-2">
                    <p className="text-xs">
                        {data.AgentCount}/{MAX_FREEE_AGENTS} Agents
                    </p>
                    <Progress value={(data.AgentCount / MAX_FREEE_AGENTS) * 100} />
                </div>
                <div className="flex flex-col gap-y-2">
                    <p className="text-xs">
                        {data.Meetingcount}/{MAX_FREEE_MEETINGS} Meetings
                    </p>
                    <Progress value={(data.Meetingcount / MAX_FREEE_MEETINGS) * 100} />
                </div>

                {/* AI Agent Usage */}
                <div className="flex flex-col gap-y-2 pt-2 border-t border-border/10">
                    <div className="flex items-center gap-2">
                        <DollarSign className="size-3" />
                        <p className="text-xs font-medium">AI Agent Usage</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                            Total Duration
                        </p>
                        <p className="text-xs font-medium">
                            {data.totalAgentDurationMinutes} min
                        </p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                            Total Cost
                        </p>
                        <p className="text-xs font-semibold text-primary">
                            ${data.totalAgentCost.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
            <Button
                className="bg-transparent border-t border-border/10 hover:bg-white/10 rounded-t-none"
                asChild
            >
                <Link href="/upgrade">
                    Upgrade
                </Link>
            </Button>
        </div>
    )
}