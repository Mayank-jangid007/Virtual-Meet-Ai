// import { NextRequest, NextResponse } from "next/server";

// import { CallEndedEvent, CallTranscriptionReadyEvent, CallSessionParticipantLeftEvent, CallRecordingReadyEvent, CallSessionStartedEvent } from "@stream-io/node-sdk";

// import { PrismaClient, MeetingStatus } from "@/generated/prisma";

// import { streamVideo } from '@/lib/stream-video'
// import { GeneratedAvatarUri } from '@/lib/avatar';


// const prisma = new PrismaClient();

// function verifySignatureWithSDK(body: string, signature: string): boolean {
//     return streamVideo.verifyWebhook(body, signature)
// }   

// export async function POST(req: NextRequest){
//     const signature = req.headers.get('x-signature');
//     const apiKey = req.headers.get('x-api-key');

//     if(!signature || !apiKey){
//         return NextResponse.json(
//             { error: 'Missing signature or API Key' },   
//             { status: 400 }   
//         )
//     }

//     const body = await req.text();

//     if(!verifySignatureWithSDK(body, signature)){
//         return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
//     }


//     let payload: unknown;
    
//     try {
//         payload = JSON.parse(body) as Record<string, unknown>;
//     } catch {
//         return NextResponse.json({ error: 'Invalid JSON'}, { status: 400 })
//     }

//     const eventType = (payload as Record<string, unknown>)?.type;

//     if(eventType === 'call.session_started'){
//         const event = payload as CallSessionStartedEvent;
//         const meetingId = event.call.custom?.meetingId;

//         if(!meetingId) {
//             return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
//         }

//         const existingMeeting = await prisma.meeting.findFirst({
//             where: {
//                 id: meetingId,
//                 status: {
//                     notIn: [MeetingStatus.COMPLETED, MeetingStatus.ACTIVE, MeetingStatus.CANCELLED, MeetingStatus.PROCESSING]
//                 }
//             }
//         });

//         if(!existingMeeting) {
//             return NextResponse.json({ error: 'Meeting not found or already processed' }, { status: 404 });
//         }

//         await prisma.meeting.update({
//             where: {
//                 id: existingMeeting.id
//             },
//             data: {
//                 status: MeetingStatus.ACTIVE,
//                 startedAt: new Date()
//             }
//         });

//         const existingAgent = await prisma.agent.findUnique({
//             where: {
//                 id: existingMeeting.agentId
//             }
//         });

//         if(!existingAgent) {
//             return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
//         }

//         const call = streamVideo.video.call('defualt', meetingId);
//         const realtimeClient = await streamVideo.video.connectOpenAi({
//             call,
//             openAiApiKey: process.env.OPENAI_API_KEY!,
//             agentUserId: existingAgent.id
//         });

//         realtimeClient.updateSession({
//             instructions: existingAgent.instructions
//         })
//     } else if (eventType === 'call.session_participant_left') {
//         const event = payload as CallSessionParticipantLeftEvent;
//         const meetingId = event.call_cid.split(':')[1];

//         if(!meetingId){             
//             return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
//         }

//         const call = streamVideo.video.call('defualt', meetingId);
//         await call.end();
//     }

//     return NextResponse.json({ status: 'ok'})
// }
 
import { NextRequest, NextResponse } from "next/server";

import { CallEndedEvent, CallTranscriptionReadyEvent, CallSessionParticipantLeftEvent, CallRecordingReadyEvent, CallSessionStartedEvent } from "@stream-io/node-sdk";

import { PrismaClient, MeetingStatus } from "@/generated/prisma";

import { streamVideo } from '@/lib/stream-video'
import { GeneratedAvatarUri } from '@/lib/avatar';
import { inngest } from "@/inngest/client";


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

    console.log("-------eventType",eventType);

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
        }else {
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

        // Ensure agent user exists in Stream
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

        // Generate token for agent
        const expirationTime = Math.floor(Date.now() / 1000) + 3600;
        const issuedAt = Math.floor(Date.now() / 1000) - 60;
        const agentToken = streamVideo.generateUserToken({
            user_id: existingAgent.id,
            exp: expirationTime,
            validity_in_seconds: issuedAt,
        });

        // Fix typo: 'defualt' -> 'default'
        const call = streamVideo.video.call('default', meetingId);
        
        // Connect OpenAI agent for real-time AI
        // This automatically connects the agent to the call
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

            // Update agent instructions
            realtimeClient.updateSession({
                instructions: existingAgent.instructions
            });
            console.log('✅ Webhook: Agent connected successfully');
            console.log('📝 Agent instructions:', existingAgent.instructions.substring(0, 100) + '...');
        } catch (error) {
            console.error('❌ Webhook: Failed to connect agent:', error);
            // Don't return error, just log it
        }
    } else if (eventType === 'call.session_participant_left') {
        const event = payload as CallSessionParticipantLeftEvent;
        const meetingId = event.call_cid.split(':')[1];

        if(!meetingId){             
            return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
        }

        // Fix typo: 'defualt' -> 'default'
        const call = streamVideo.video.call('default', meetingId);
        await call.end();

    } else if (eventType === 'call.session_ended') {
        const event  = payload as CallEndedEvent
        const meetingId  = event.call.custom?.meetingId;

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

    // }   else if (eventType === 'call.transcriptionReadyEvent') {
    }   else if (eventType === 'call.transcription_ready') {
        const event  = payload as CallTranscriptionReadyEvent;
        const meetingId  = event.call_cid.split(':')[1];

        const updatedMeeting = await prisma.meeting.updateMany({
        // const updatedMeeting = await prisma.meeting.update({
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
                // meetingId: updatedMeeting.id,
                // transcriptionUrl: updatedMeeting.transcriptionUrl
            }
        })
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
        })
    }
    return NextResponse.json({ status: 'ok' })

}
 