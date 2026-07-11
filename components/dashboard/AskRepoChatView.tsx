"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, FileCode, Loader2, Sparkles } from "lucide-react";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { mockChatMessages } from "@/lib/mock-data";
import type { ChatMessage } from "@/types";

const SUGGESTED_QUESTIONS = [
  "Where is the authentication logic in this project?",
  "How do I add a new page in the App Router?",
  "Where is the server configuration handled?",
  "What is the build pipeline and compiler configuration?",
];

const MOCK_ANSWERS: Record<string, { content: string; files: string[] }> = {
  "Where is the server configuration handled?": {
    content: "The server configuration and bootstrapping logic for Next.js is primarily handled in `packages/next/src/server/next-server.ts`. This file implements the main NextServer class which initializes configuration configuration parameters, sets up middleware adapters, and hooks up the request-response routers.",
    files: ["packages/next/src/server/next-server.ts", "packages/next/src/server/base-server.ts"],
  },
  "What is the build pipeline and compiler configuration?": {
    content: "Next.js uses a custom build compiler pipeline powered by Rust via SWC. The main configuration and compiler interface reside in `packages/next/src/build/index.ts`. Webpack and Turbopack compiler setups are resolved inside `webpack-config.ts` depending on the build profile chosen.",
    files: ["packages/next/src/build/index.ts", "packages/next/src/build/webpack-config.ts"],
  },
};

export function AskRepoChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const scrollArea = scrollContainerRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendMessage = (content: string) => {
    if (!content.trim() || isThinking) return;

    const nextId = messages.length + 1;
    const userMsg: ChatMessage = {
      id: `msg_user_${nextId}`,
      role: "user",
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsThinking(true);

    // Simulate AI response delay
    setTimeout(() => {
      const matchedAnswer = MOCK_ANSWERS[content.trim()] ?? {
        content: `I've analyzed the codebase context for your query. Regarding "${content}", Next.js addresses this through its modular compiler pipeline and app router engines. You can find related symbols inside the core packages directory. Let me know if you need specific function mappings!`,
        files: ["packages/next/package.json"],
      };

      const assistantMsg: ChatMessage = {
        id: `msg_assistant_${nextId + 1}`,
        role: "assistant",
        content: matchedAnswer.content,
        referencedFiles: matchedAnswer.files,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 1200);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col justify-between">
      {/* Title section */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Ask Repo
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Chat with the AI model containing complete layout index mappings of this repository.
        </p>
      </div>

      {/* Main Chat card */}
      <Card className="glass border-border/40 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <CardHeader className="p-4 border-b border-border/20 flex flex-row items-center gap-2 shrink-0">
          <Bot className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              Repository Assistant
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">
              Powered by Gemini 2.5 Flash
            </p>
          </div>
        </CardHeader>

        {/* Messages list */}
        <div ref={scrollContainerRef} className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4 pb-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isUser = msg.role === "user";

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 max-w-[85%] ${
                        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold ${
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground border border-border/40"
                        }`}
                      >
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-2">
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isUser
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-secondary/40 text-foreground border border-border/20"
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>

                        {/* Referenced Files (AI only) */}
                        {!isUser && msg.referencedFiles && msg.referencedFiles.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pl-1">
                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
                              <FileCode className="h-3 w-3" />
                              References:
                            </span>
                            {msg.referencedFiles.map((file) => (
                              <Badge
                                key={file}
                                variant="outline"
                                className="font-mono text-[9px] bg-secondary/10 border-border/30 text-foreground"
                              >
                                {file}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* AI Thinking loader state */}
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 max-w-[85%] mr-auto"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground border border-border/40">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-secondary/40 text-foreground border border-border/20 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Assistant is checking codebase indexes…</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Suggested Questions */}
        {messages.length <= 4 && (
          <div className="px-4 py-2.5 border-t border-border/20 shrink-0 space-y-1.5 bg-secondary/5">
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Suggested Questions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSendMessage(question)}
                  className="text-xs text-left bg-secondary/20 hover:bg-secondary/50 border border-border/30 text-foreground/80 hover:text-foreground rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer max-w-full truncate"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <CardFooter className="p-3 border-t border-border/20 bg-card/20 shrink-0">
          <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question about vercel/next.js…"
              className="flex-1 bg-secondary/45 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors"
              disabled={isThinking}
              aria-label="Repository chat message input"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 transition-all cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
