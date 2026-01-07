import { OpenAI } from "openai"; 
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { NextRequest, NextResponse } from "next/server";

import { MessageNewEvent, CallEndedEvent, CallTranscriptionReadyEvent, CallSessionParticipantLeftEvent, CallRecordingReadyEvent, CallSessionStartedEvent } from "@stream-io/node-sdk";

import { PrismaClient, MeetingStatus } from "@/generated/prisma";

import { streamVideo } from '@/lib/stream-video'
import { GeneratedAvatarUri } from '@/lib/avatar';
import { inngest } from "@/inngest/client";
import { streamChat } from "@/lib/stream-chat";


const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const prisma = new PrismaClient();

function verifySignatureWithSDK(body: string, signature: string): boolean {
    return streamVideo.verifyWebhook(body, signature)
}   

export async function POST(req: NextRequest){
    console.log('WEBHOOK CALLED!'); 
    const signature = req.headers.get('x-signature');
    const apiKey = req.headers.get('x-api-key');

    if(!signature || !apiKey){
        return NextResponse.json(
            { error: 'Missing signature or API Key' },   
            { status: 400 }   
        )
    }

    const body = await req.text();

    if(!verifySignatureWithSDK(body, signature)){
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let payload: unknown;
    
    try {
        payload = JSON.parse(body) as Record<string, unknown>;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON'}, { status: 400 })
    }

    const eventType = (payload as Record<string, unknown>)?.type;

    console.log("📡 Webhook Event:", eventType);

    if(eventType === 'call.session_started'){
        const event = payload as CallSessionStartedEvent;
        const meetingId = event.call.custom?.meetingId;

        console.log("🎯 Session Started - Meeting ID:", meetingId);

        if(!meetingId) {
            return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
        }

        const existingMeeting = await prisma.meeting.findUnique({
            where: { id: meetingId }
        });

        if(!existingMeeting) {
            console.error("❌ Meeting not found:", meetingId);
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        
        if(existingMeeting.status === MeetingStatus.COMPLETED || 
           existingMeeting.status === MeetingStatus.CANCELLED ||
           existingMeeting.status === MeetingStatus.ACTIVE) {
            console.log("⏭️ Meeting already active/processed, skipping agent connection");
            return NextResponse.json({ status: 'ok' });
        }

        
        await prisma.meeting.update({
            where: { id: existingMeeting.id },
            data: {
                status: MeetingStatus.ACTIVE,
                startedAt: new Date()
            }
        });
        console.log('✅ Meeting status updated to ACTIVE, connecting agent...');

        
        const existingAgent = await prisma.agent.findUnique({
            where: { id: existingMeeting.agentId }
        });

        if(!existingAgent) {
            console.error(" Agent not found:", existingMeeting.agentId);
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
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

        const call = streamVideo.video.call('default', meetingId);
        
        // Connect OpenAI agent
        try {
            if (!process.env.OPENAI_API_KEY) {
                console.error(' OPENAI_API_KEY is missing!');
                return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
            }

            console.log('🤖 Connecting agent to call:', existingAgent.id);
            
            const realtimeClient = await streamVideo.video.connectOpenAi({
                call,
                openAiApiKey: process.env.OPENAI_API_KEY,
                agentUserId: existingAgent.id
            });

            // Update agent instructions
            realtimeClient.updateSession({
                instructions: existingAgent.instructions,
                voice: 'alloy',
                turn_detection: {
                    type: 'server_vad',
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500
                }
            });
            
            console.log('✅ Agent connected successfully');
            console.log('📝 Instructions:', existingAgent.instructions.substring(0, 100) + '...');
            
        } catch (error) {
            console.error(' Failed to connect agent:', error);
            return NextResponse.json({ 
                error: 'Failed to connect agent',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }

    } else if (eventType === 'call.session_participant_left') {
        const event = payload as CallSessionParticipantLeftEvent;
        const meetingId = event.call_cid.split(':')[1];

        console.log(" Participant left - Meeting ID:", meetingId);

        if(!meetingId){             
            return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
        }

        const call = streamVideo.video.call('default', meetingId);
        await call.end();

    } else if (eventType === 'call.session_ended') {
        const event  = payload as CallEndedEvent
        const meetingId  = event.call.custom?.meetingId;

        console.log(" Session ended - Meeting ID:", meetingId);

        if(!meetingId){             
            return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
        }

        await prisma.meeting.updateMany({
            where: {
              id: meetingId,
              status: MeetingStatus.ACTIVE,
            },
            data: {
              status: MeetingStatus.PROCESSING,
              endedAt: new Date(),
            },
        }); 

        console.log('✅ Meeting status updated to PROCESSING');

    } else if (eventType === 'call.transcription_ready') {
        const event  = payload as CallTranscriptionReadyEvent;
        const meetingId  = event.call_cid.split(':')[1];

        console.log("📝 Transcription ready - Meeting ID:", meetingId);

        const updatedMeeting = await prisma.meeting.updateMany({
            where: { id: meetingId },
            data: {
                transcriptionUrl: event.call_transcription.url
            },
        });

        console.log('✅ Transcription URL saved:', event.call_transcription.url);

        if(!updatedMeeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        await inngest.send({
            name: 'meetings/processing',
            data: {
                meetingId,
                transcriptionUrl: event.call_transcription.url
            }
        })

    } else if (eventType === 'call.recording_ready') {
        const event = payload as CallRecordingReadyEvent;
        const meetingId = event.call_cid.split(':')[1];

        console.log("🎥 Recording ready - Meeting ID:", meetingId);

        await prisma.meeting.updateMany({
            where: { id: meetingId },
            data: {
                recordingUrl: event.call_recording.url
            }
        })

        console.log('✅ Recording URL saved:', event.call_recording.url);

    } else if(eventType === 'message.new') {
        const event = payload as MessageNewEvent;
        const userId = event.user?.id;
        const channelId = event.channel_id;
        const text = event.message?.text;

        console.log("💬 New message in channel:", channelId);

        if (!userId || !channelId || !text) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400}
            );
        }

        const existingMeeting = await prisma.meeting.findFirst({
            where: {
                id: channelId,
                status: MeetingStatus.COMPLETED,
            },
        });
        
        if (!existingMeeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }
        
        const existingAgent = await prisma.agent.findUnique({
            where: { id: existingMeeting.agentId },
        });

        if (!existingAgent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        if(userId !== existingAgent.id) {
            const instructions = `
                You are an AI assistant helping the user revisit a recently completed meeting.
                Below is a summary of the meeting, generated from the transcript:
                
                ${existingMeeting.summary}
                
                The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
                
                ${existingAgent.instructions}
                
                The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
                Always base your responses on the meeting summary above.
                
                You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.
                
                If the summary does not contain enough information to answer a question, politely let the user know.
                
                Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
            `;

            const channel = streamChat.channel('messaging', channelId);
            await channel.watch();

            const previousMessages = channel.state.messages
                .slice(-5)
                .filter((msg) => msg.text && msg.text.trim() !== "")
                .map<ChatCompletionMessageParam>((message) => ({
                 role: message.user?.id === existingAgent.id ? "assistant" : "user",
                 content: message.text || "",
                }));

            const GPTResponse = await openaiClient.chat.completions.create({
                messages: [
                    { role: "system", content: instructions },
                    ...previousMessages,
                    { role: "user", content: text},
                ],
                model: "gpt-4o",
            });

            const GPTResponseText = GPTResponse.choices[0].message.content;
            if (!GPTResponseText) {
                return NextResponse.json(
                    { error: "No response from GPT" },
                    { status: 400}
                );
            }
            
            const avatarUrl = GeneratedAvatarUri({ 
                seed: existingAgent.name,
                variant: "botttsNeutral",
            });  

            await streamChat.upsertUser({
                id: existingAgent.id,
                name: existingAgent.name,
                image: avatarUrl,
            });

            await channel.sendMessage({
                text: GPTResponseText,
                user: {
                    id: existingAgent.id,
                    name: existingAgent.name,
                    image: avatarUrl,
                },
            });
        }
    }

    return NextResponse.json({ status: 'ok' })
}