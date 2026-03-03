import { Message } from "@/pages/Chat";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface Props {
  messages: Message[];
  isStreaming: boolean;
}

const ChatMessages = ({ messages, isStreaming }: Props) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-md">
          <Bot className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2">How can I help you?</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          I'm fluent in Mizo & English. Ask me anything — ka lo hrilh che ang!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" && (
            <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center shrink-0 mt-1">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <div
            className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-chat-ai text-chat-ai-foreground rounded-bl-md"
            }`}
          >
            {msg.role === "assistant" ? (
              <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              msg.content
            )}
          </div>
          {msg.role === "user" && (
            <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
              <User className="h-4 w-4 text-secondary-foreground" />
            </div>
          )}
        </motion.div>
      ))}
      {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
        <div className="flex gap-3 items-start">
          <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="bg-chat-ai rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "300ms" }} />
              <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "600ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;
