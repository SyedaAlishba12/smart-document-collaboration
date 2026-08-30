"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import MentionList from "./MentionList";
import apiFetch from "@/lib/api";

interface CommentInputProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
}

interface MentionUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export default function CommentInput({
  onSubmit,
  placeholder = "Add a comment…",
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);

  // Mention detection logic
  useEffect(() => {
    const match = content.match(/@(\w*)$/);
    if (match) {
      setShowMentions(true);
      fetchUsers(match[1]);
    } else {
      setShowMentions(false);
    }
  }, [content]);

  const fetchUsers = async (query: string) => {
    try {
      const response = await apiFetch<any>(`/api/search/users?query=${query}`);
      const users = response.data || [];
      setMentionUsers(
        users.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.name || u.email,
          avatarUrl: u.avatar_url,
        }))
      );
    } catch (error) {
      setMentionUsers([
        { id: "1", name: "Syeda Alishba" },
        { id: "2", name: "Zainab Bibi" },
      ]);
    }
  };

  const handleSelectMention = (user: MentionUser) => {
    const newContent = content.replace(/@(\w*)$/, `@${user.name} `);
    setContent(newContent);
    setShowMentions(false);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent("");
  };

  return (
    <div className="relative flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setContent(e.target.value)
        }
        placeholder={placeholder}
        className="min-h-[70px]"
      />

      {showMentions && (
        <MentionList users={mentionUsers} onSelect={handleSelectMention} />
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim()}
        >
          <Send className="h-3.5 w-3.5" />
          Comment
        </Button>
      </div>
    </div>
  );
}