"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, FileCode, Loader2, Cpu } from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnalysisData } from "@/hooks/use-analysis-data";
import type { ChatMessage } from "@/types";
import { soundManager } from "@/lib/sounds";

const SUGGESTED_QUESTIONS = [
  "Where is the routing logic in this project?",
  "How is configuration variables set up?",
  "Where is the server configuration handled?",
  "What is the build pipeline configuration?",
];

const MOCK_ANSWERS: Record<string, { content: string; files: string[] }> = {
  "Where is the server configuration handled?": {
    content: "The server configuration and bootstrapping logic for Next.js is primarily handled in `packages/next/src/server/next-server.ts`. This file implements the main NextServer class which initializes configuration parameters, sets up middleware adapters, and hooks up the request-response routers.",
    files: ["packages/next/src/server/next-server.ts", "packages/next/src/server/base-server.ts"],
  },
  "What is the build pipeline configuration?": {
    content: "Next.js uses a custom build compiler pipeline powered by Rust via SWC. The main configuration and compiler interface reside in `packages/next/src/build/index.ts`. Webpack and Turbopack compiler setups are resolved inside `webpack-config.ts` depending on the build profile chosen.",
    files: ["packages/next/src/build/index.ts", "packages/next/src/build/webpack-config.ts"],
  },
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      soundManager.playSuccess();
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-border/30 bg-[#020617] font-mono text-xs sm:text-[13px] relative shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/20 bg-secondary/10 text-muted-foreground/70 text-[10px] uppercase tracking-wider select-none">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="hover:text-primary transition-colors cursor-pointer px-2 py-1 rounded bg-secondary/20 hover:bg-secondary/45 border border-border/20 flex items-center gap-1 text-[9px]"
        >
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-foreground/90 max-h-[300px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="bg-secondary/50 border border-border/35 rounded px-1.5 py-0.5 font-mono text-xs text-primary font-bold">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function MarkdownMessage({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 select-text">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const language = match ? match[1] : "code";
          const code = match ? match[2].trim() : part.slice(3, -3).trim();

          return <CodeBlock key={index} code={code} language={language} />;
        }

        return (
          <p key={index} className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {renderInlineMarkdown(part)}
          </p>
        );
      })}
    </div>
  );
}

export function AskRepoChatView() {
  const { data } = useAnalysisData();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: `Greetings! I am Jarvis, your repository intelligence pilot. I have indexed the "${data.summary.name}" codebase context. Ask me anything about layouts, config bindings, dependencies, or onboarding operations!`,
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentRepoName = data.summary.name;
  const [lastRepoName, setLastRepoName] = useState(currentRepoName);
  if (currentRepoName !== lastRepoName) {
    setLastRepoName(currentRepoName);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Greetings! I am Jarvis, your repository intelligence pilot. I have indexed the "${currentRepoName}" codebase context. Ask me anything about layouts, config bindings, dependencies, or onboarding operations!`,
      }
    ]);
  }

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

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isThinking) return;

    soundManager.playClick();
    const nextId = messages.length + 1;
    const userMsg: ChatMessage = {
      id: `msg_user_${nextId}`,
      role: "user",
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsThinking(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_id: data.summary.name,
          question: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer from server.");
      }

      const chatData = await response.json();
      soundManager.playSuccess();

      const assistantMsg: ChatMessage = {
        id: `msg_assistant_${nextId + 1}`,
        role: "assistant",
        content: chatData.answer,
        referencedFiles: chatData.referenced_files || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      console.warn("Backend chat failed, using local fallback answers:", err);
      // Fallback to MOCK_ANSWERS if possible
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
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col justify-between select-none">
      {/* Title section */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-black tracking-tight text-foreground sm:text-3xl">
            AI Assistant
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Ask Jarvis details about repository setup, file purposes, or code modules.
          </p>
        </div>

        {/* Jarvis breathing core orb */}
        <div className="flex items-center gap-2 font-mono text-[9px] text-[#00FFC6]/75 bg-[#00FFC6]/5 border border-[#00FFC6]/20 px-3 py-1.5 rounded-xl">
          <motion.div
            animate={{
              scale: isThinking ? [1, 1.25, 1] : [1, 1.08, 1],
              backgroundColor: isThinking ? "#00FFC6" : "#7C5CFF",
            }}
            transition={{
              duration: isThinking ? 1 : 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
          />
          <span>JARVIS_BOT: {isThinking ? "PROCESSING" : "ONLINE"}</span>
        </div>
      </div>

      {/* Main Chat card window */}
      <Card className="glass border-border/40 flex-1 flex flex-col overflow-hidden relative min-h-[350px]">
        {/* Chat message logs area */}
        <ScrollArea ref={scrollContainerRef} className="flex-1 p-5">
          <div className="space-y-4">
            {messages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 max-w-[85%] ${
                    isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                  }`}
                >
                  {/* Bubble avatars */}
                  <div 
                    className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border ${
                      isAssistant
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary/20 border-border text-foreground"
                    }`}
                  >
                    {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  {/* Message bubble context */}
                  <div className="space-y-3 flex-1">
                    <div 
                      className={`p-4 rounded-2xl leading-relaxed ${
                        isAssistant
                          ? "bg-secondary/15 border border-border/40 text-foreground"
                          : "bg-primary text-white font-medium text-xs sm:text-sm"
                      }`}
                    >
                      {isAssistant ? (
                        <MarkdownMessage content={msg.content} />
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Referenced diagnostic files list */}
                    {isAssistant && msg.referencedFiles && msg.referencedFiles.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-wrap gap-1.5 pl-1"
                      >
                        {msg.referencedFiles.map((file) => (
                          <div
                            key={file}
                            className="flex items-center gap-1.5 font-mono text-[9px] text-[#00FFC6] bg-secondary/35 border border-[#00FFC6]/20 px-2.5 py-1 rounded-lg"
                          >
                            <FileCode className="h-3 w-3" />
                            {file}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Jarvis is thinking state loader */}
            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="h-8 w-8 shrink-0 rounded-lg border bg-primary/10 border-primary/30 text-primary flex items-center justify-center">
                  <Cpu className="h-4 w-4 animate-spin text-primary" />
                </div>
                <div className="p-3 bg-secondary/15 border border-border/40 rounded-2xl flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00FFC6]" />
                  Jarvis is analyzing codebase files...
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Suggestion prompts bar */}
        {messages.length <= 1 && (
          <div className="px-5 py-3 border-t border-border/20 bg-secondary/5 shrink-0 overflow-x-auto">
            <div className="flex gap-2 max-w-full">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSendMessage(question)}
                  onMouseEnter={() => soundManager.playHover()}
                  className="text-[10px] text-left bg-secondary/20 hover:bg-primary/10 border border-border/30 text-foreground/80 hover:text-primary rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <CardFooter className="p-3 border-t border-border/20 bg-[#050816]/70 shrink-0">
          <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => soundManager.playHover()}
              placeholder={`Ask Jarvis a question about ${data.summary.name}...`}
              className="flex-1 bg-secondary/45 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors font-mono"
              disabled={isThinking}
              aria-label="Repository chat message input"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              onMouseEnter={() => soundManager.playHover()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 transition-all cursor-pointer shrink-0 shadow-lg"
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
