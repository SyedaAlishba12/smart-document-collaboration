"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

interface CommentInputProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
}

export default function CommentInput({
  onSubmit,
  placeholder = "Add a comment…",
}: CommentInputProps) {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent("");
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setContent(e.target.value)
        }
        placeholder={placeholder}
        className="min-h-[70px]"
      />

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