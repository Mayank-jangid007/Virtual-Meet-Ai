import Markdown from 'react-markdown'
import Link from 'next/link';

import { GeneratedAvatarProp } from '@/components/ui/generated_avatar';
import { MeetingGetOne } from "../../types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

import { 
    BookOpenTextIcon,
    SparklesIcon,
    FileTextIcon,
    ClockFadingIcon,
    FileVideoIcon,
} from "lucide-react";
import { Badge } from '@/components/ui/badge';

import { formatDuration } from '@/lib/utils';
import { Transcript } from './transcript';
import { ChatProvider } from './chat-provider';

interface Props {
    data: MeetingGetOne;
}

export const CompletedState = ({ data }: Props) => {
    return (
        <div className="flex flex-col gap-y-4">
            <Tabs defaultValue="summary">
                <div className="bg-white rounded-lg border px-3">
                    <ScrollArea>
                        <TabsList className="p-0 bg-background justify-start rounded-none h-13">
                            <TabsTrigger 
                                value="summary"
                                className="text-muted-foreground rounded-none bg-background data-[state=active]: shadow-none border-b-2
                                border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
                            >
                                <BookOpenTextIcon />
                                Summary
                            </TabsTrigger>
                            <TabsTrigger 
                                value="transcript"
                                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
                            >
                                <FileTextIcon />
                                Transcript
                            </TabsTrigger>
                            <TabsTrigger 
                                value="recording"
                                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
                            >
                                <FileVideoIcon />
                                Recording
                            </TabsTrigger>
                            <TabsTrigger 
                                value="chat"
                                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
                            >
                                <SparklesIcon />
                                Ask AI
                            </TabsTrigger>
                        </TabsList>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
                <TabsContent value="chat">
                    <ChatProvider meetingId={data.existingMeeting.id} meetingName={data.existingMeeting.name} />
                </TabsContent>
                <TabsContent value="transcript">
                    <Transcript meetingId={data.existingMeeting.id} />
                </TabsContent>
                <TabsContent value="recording">
                    <div className="bg-white rounded-lg border px-4 py-5">
                    <video
                        src={data.existingMeeting.recordingUrl!}
                        className="w-full rounded-lg"
                        controls
                    />
                    </div>
                </TabsContent>    
                <TabsContent value="summary">
                    <div className="bg-white rounded-lg border">
                        <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
                            <h2 className="text-2xl font-medium capitalize">{data.existingMeeting.name}</h2>
                            <div className="flex gap-x-2 items-center">
                                <Link
                                    href={`/agents/${data.existingMeeting.agent.id}`}
                                    className="flex items-center gap-x-2 underline underline-offset-4 capital" 
                                > 
                                    <GeneratedAvatarProp
                                        variant='botttsNeutral'
                                        seed={data.existingMeeting.name}
                                        className='size-5'
                                    />
                                    {data.existingMeeting.agent.name}
                                </Link>
                                <p>{data.existingMeeting.startedAt ? format(data.existingMeeting.startedAt, "PPP") :  ""}</p>
                            </div>
                            <div className="flex gap-x-2 items-center">
                                <SparklesIcon className="size-4" />
                                <p>General summary</p>
                            </div>
                            <Badge
                                variant="outline"
                                className="flex items-center gap-x-2 [&>svg]:size-4"
                            >
                                <ClockFadingIcon className='text-blue-700' />
                                {data.duration ? formatDuration(data.duration): 'No duration'}
                            </Badge>
                            <div>
                                <Markdown
                                    components={{
                                        h1: (props) => (
                                            <h1 className='text-2xl font-medium mb-6' {...props} />
                                        ),
                                        h2: (props) => (
                                            <h2 className="text-xl font-medium mb-6" {...props} />
                                        ),
                                        h3: (props) => (
                                            <h3 className="text-lg font-medium mb-6" {...props} />
                                        ), 
                                        h4: (props) => (
                                            <h4 className="text-base font-medium mb-6" {...props} />
                                        ),
                                        p: (props) => (
                                            <p className="mb-6 leading-relaxed mb-6" {...props} />
                                        ),
                                        ul: (props) => (
                                            <ul className="list-dics list-inside mb-6" {...props} />
                                        ),
                                        ol: (props) => (
                                            <ol className="list-dics list-inside mb-6" {...props} />
                                        ),
                                        li: (props) => (
                                            <li className="mb-1" {...props} />
                                        ),
                                        strong: (props) => (
                                            <strong className="font-semibold" {...props} />
                                        ),
                                        code: (props) => (
                                            <code className="bg-gray-100 px-1 py-0.5 rounded" {...props} />
                                        ),
                                        blockquote: (props) => (
                                            <code className="border-l-4 pl-4 italic my-4" {...props} />
                                        ),
                                    }}
                                >
                                    {data.existingMeeting.summary}
                                </Markdown>
                            </div>
                        </div>
                    </div>
                </TabsContent>    
            </Tabs>
        </div>
    )
}