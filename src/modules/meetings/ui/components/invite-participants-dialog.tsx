// src/modules/meetings/ui/components/invite-participants-dialog.tsx
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Copy, Mail, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@tanstack/react-query";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
});

interface Props {
  meetingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPublic?: boolean;
  onTogglePublic?: (isPublic: boolean) => void;
}

export const InviteParticipantsDialog = ({
  meetingId,
  open,
  onOpenChange,
  isPublic = false,
  onTogglePublic,
}: Props) => {
  const trpc = useTRPC();
  const [emails, setEmails] = useState<string[]>([]);

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const inviteMutation = useMutation(trpc.meetings.inviteParticipants.mutationOptions({
    onSuccess: () => {
      toast.success("Invitations sent!");
      setEmails([]);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  const addEmail = (data: z.infer<typeof inviteSchema>) => {
    if (emails.includes(data.email.toLowerCase())) {
      toast.error("Email already added");
      return;
    }
    setEmails([...emails, data.email.toLowerCase()]);
    form.reset();
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const sendInvitations = () => {
    if (emails.length === 0) {
      toast.error("Add at least one email");
      return;
    }
    inviteMutation.mutate({ meetingId, emails });
  };

  const copyMeetingLink = () => {
    const link = `${window.location.origin}/meetings/${meetingId}/join`;
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Participants</DialogTitle>
          <DialogDescription>
            Invite people to join your meeting by email or share the meeting
            link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Public/Private Toggle */}
          {onTogglePublic && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Public Meeting</div>
                <div className="text-xs text-muted-foreground">
                  Anyone with the link can join
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={onTogglePublic} />
            </div>
          )}

          {/* Copy Meeting Link */}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={`${window.location.origin}/meetings/${meetingId}/join`}
              className="flex-1"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={copyMeetingLink}
              type="button"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Email Input */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(addEmail)}
              className="flex gap-2"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="Enter email address"
                        {...field}
                        disabled={inviteMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="icon"
                disabled={inviteMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </Form>

          {/* Email List */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Emails to invite ({emails.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={sendInvitations}
            disabled={emails.length === 0 || inviteMutation.isPending}
            className="w-full"
          >
            {inviteMutation.isPending ? "Sending..." : "Send Invitations"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};