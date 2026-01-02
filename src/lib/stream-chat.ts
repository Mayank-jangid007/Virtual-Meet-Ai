import "server-only";
import { StreamChat } from "stream-chat";

if (!process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY) {
    throw new Error('NEXT_PUBLIC_STREAM_CHAT_API_KEY is not defined');
}

if (!process.env.NEXT_CHAT_STREAM_SECRETE_KEY) {
    throw new Error('NEXT_CHAT_STREAM_SECRETE_KEY is not defined--');
}


export const streamChat = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
    process.env.NEXT_CHAT_STREAM_SECRETE_KEY!
);