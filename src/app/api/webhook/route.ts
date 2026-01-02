import { OpenAI } from "openai"; // ✅ Fixed typo: "OpenAi" -> "OpenAI"
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
    console.log("-------eventType", eventType);

    if(eventType === 'call.session_started'){
        const event = payload as CallSessionStartedEvent;
        const meetingId = event.call.custom?.meetingId;

        if(!meetingId) {
            return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
        }

        const existingMeeting = await prisma.meeting.findFirst({
            where: {
                id: meetingId,
                status: {
                    notIn: [MeetingStatus.COMPLETED, MeetingStatus.ACTIVE, MeetingStatus.CANCELLED, MeetingStatus.PROCESSING]
                }
            }
        });

        if(!existingMeeting) {
            return NextResponse.json({ error: 'Meeting not found or already processed' }, { status: 404 });
        }

        if(existingMeeting.status !== MeetingStatus.ACTIVE){
            await prisma.meeting.update({
                where: {
                    id: existingMeeting.id
                },
                data: {
                    status: MeetingStatus.ACTIVE,
                    startedAt: new Date()
                }
            });
            console.log('✅ Meeting status updated to ACTIVE');
        } else {
            console.log('⚠️ Meeting already ACTIVE, skipping update');
        }

        const existingAgent = await prisma.agent.findUnique({
            where: {
                id: existingMeeting.agentId
            }
        });

        if(!existingAgent) {
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
        
        try {
            if (!process.env.OPENAI_API_KEY) {
                console.error('⚠️ OPENAI_API_KEY is missing in webhook!');
                return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
            }

            console.log('🤖 Webhook: Connecting agent to call:', existingAgent.id);
            const realtimeClient = await streamVideo.video.connectOpenAi({
                call,
                openAiApiKey: process.env.OPENAI_API_KEY,
                agentUserId: existingAgent.id
            });

            realtimeClient.updateSession({
                instructions: existingAgent.instructions
            });
            console.log('✅ Webhook: Agent connected successfully');
        } catch (error) {
            console.error('❌ Webhook: Failed to connect agent:', error);
        }

        return NextResponse.json({ status: 'ok' });

    } else if (eventType === 'call.session_participant_left') {
        const event = payload as CallSessionParticipantLeftEvent;
        const meetingId = event.call_cid.split(':')[1];

        if(!meetingId){             
            return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
        }

        const call = streamVideo.video.call('default', meetingId);
        await call.end();

        return NextResponse.json({ status: 'ok' });

    } else if (eventType === 'call.session_ended') {
        const event = payload as CallEndedEvent;
        const meetingId = event.call.custom?.meetingId;

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

        return NextResponse.json({ status: 'ok' });

    } else if (eventType === 'call.transcription_ready') {
        const event = payload as CallTranscriptionReadyEvent;
        const meetingId = event.call_cid.split(':')[1];

        const updatedMeeting = await prisma.meeting.updateMany({
            where: {
                id: meetingId
            },
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
        });

        return NextResponse.json({ status: 'ok' });

    } else if (eventType === 'call.recording_ready') {
        const event = payload as CallRecordingReadyEvent;
        const meetingId = event.call_cid.split(':')[1];

        await prisma.meeting.updateMany({
            where: {
                id: meetingId
            },
            data: {
                recordingUrl: event.call_recording.url
            }
        });

        return NextResponse.json({ status: 'ok' });

    } else if(eventType === 'message.new') {
        const event = payload as MessageNewEvent;
        const userId = event.user?.id;
        const channelId = event.channel_id;
        const text = event.message?.text;

        // ✅ Fixed logic error: should be || not &&
        if (!userId || !channelId || !text) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
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
            where: {
                id: existingMeeting.agentId,
            },
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
                    { role: "user", content: text },
                ],
                model: "gpt-4o", // ✅ Fixed typo: "gpt-40" -> "gpt-4o"
            });

            const GPTResponseText = GPTResponse.choices[0].message.content;
            if (!GPTResponseText) {
                return NextResponse.json(
                    { error: "No response from GPT" },
                    { status: 400 }
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

        return NextResponse.json({ status: 'ok' });
    }

    return NextResponse.json({ status: 'ok' });
}