import { GeneratedAvatarUri } from "@/lib/avatar";
import { streamVideo } from "@/lib/stream-video";
import { prisma } from "@/lib/prisma";

interface AgentConnectionResult {
    success: boolean;
    error?: string;
}

// Store active OpenAI connections so we can disconnect them properly
const activeAgentConnections = new Map<string, any>();

export const connectAgentToCall = async (
    meetingId: string,
    agentId: string,
    agentName: string,
    instructions: string,
): Promise<AgentConnectionResult> => {

    try {

        if (!process.env.OPENAI_API_KEY) {
            console.error("OPENAI_API_KEY is missing")
            return { success: false, error: 'OpenAI API key not configured' }
        }

        // Meeting ID is used as the Stream call ID
        const callId = meetingId;

        await streamVideo.upsertUsers([
            {
                id: agentId,
                name: agentName,
                role: 'user',
                image: GeneratedAvatarUri({
                    seed: agentName,
                    variant: "botttsNeutral"
                })
            }
        ])

        console.log('🤖 Connecting agent to call:', agentId);

        const call = await streamVideo.video.call('default', callId)

        const realtimeClient = await streamVideo.video.connectOpenAi({
            call,
            openAiApiKey: process.env.OPENAI_API_KEY,
            agentUserId: agentId
        })

        // Store the client so we can disconnect it later
        activeAgentConnections.set(agentId, realtimeClient);
        console.log('📝 Stored OpenAI client for agent:', agentId);

        realtimeClient.updateSession({
            instructions: instructions,
            voice: 'alloy',
            turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
            }
        });

        // ✅ Update database with connection timestamp
        const connectedAt = new Date();
        await prisma.meeting.update({
            where: { id: meetingId },
            data: {
                agentConnectedAt: connectedAt,
                agentDisconnectedAt: null, // Reset disconnect time
            }
        });

        console.log("✅ Agent connected successfully at:", connectedAt.toISOString());
        console.log('📝 Instructions:', instructions.substring(0, 100) + '...');

        return { success: true }

    } catch (error) {
        console.error('❌ Failed to connect agent:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }

}

export const disconnectAgentFromCall = async (
    meetingId: string
): Promise<AgentConnectionResult> => {

    try {

        // Get the meeting to find agent info and calculate duration
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            select: {
                agentConnectedAt: true,
                agent: {
                    select: { id: true }
                }
            }
        });

        if (!meeting?.agent?.id) {
            console.error("Meeting or agent not found");
            return { success: false, error: 'Meeting not found' };
        }

        const agentId = meeting.agent.id;
        const callId = meetingId; // Meeting ID is used as Stream call ID

        console.log('🔌 Disconnecting agent from call:', agentId);

        // First, close the OpenAI Realtime connection if it exists
        const realtimeClient = activeAgentConnections.get(agentId);
        if (realtimeClient) {
            try {
                console.log('🔌 Closing OpenAI Realtime connection for:', agentId);
                // Close the WebSocket connection
                if (typeof realtimeClient.close === 'function') {
                    await realtimeClient.close();
                } else if (typeof realtimeClient.disconnect === 'function') {
                    await realtimeClient.disconnect();
                }
                activeAgentConnections.delete(agentId);
                console.log('✅ OpenAI connection closed and removed from map');
            } catch (closeError) {
                console.warn('⚠️ Error closing OpenAI connection:', closeError);
                // Continue anyway to remove from call
            }
        } else {
            console.warn('⚠️ No active OpenAI connection found for agent:', agentId);
        }

        // Then remove the agent from the call members
        const call = streamVideo.video.call('default', callId)
        await call.updateCallMembers({
            remove_members: [agentId]
        });

        console.log('✅ Agent removed from call members');

        // ✅ Update database with disconnection timestamp and calculate duration
        const disconnectedAt = new Date();
        let durationSeconds = 0;

        if (meeting.agentConnectedAt) {
            durationSeconds = Math.floor(
                (disconnectedAt.getTime() - meeting.agentConnectedAt.getTime()) / 1000
            );
            console.log(`⏱️ Agent was connected for ${durationSeconds} seconds (${Math.floor(durationSeconds / 60)} minutes)`);
        }

        await prisma.meeting.update({
            where: { id: meetingId },
            data: {
                agentDisconnectedAt: disconnectedAt,
                agentTotalDuration: durationSeconds,
            }
        });

        console.log("✅ Agent disconnected successfully at:", disconnectedAt.toISOString());
        console.log(`💰 Total duration: ${durationSeconds}s`);

        return {
            success: true,
        }

    } catch (error) {
        console.error('❌ Failed to disconnect agent:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }

}


