"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface ReplyInputProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
}

export default function ReplyInput({
  onSubmit,
  placeholder = "Reply…",
}: ReplyInputProps) {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent("");
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={content}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setContent(e.target.value)
        }
        placeholder={placeholder}
        className="h-9"
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!content.trim()}
        className="h-9 px-3"
      >
        <Send className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}