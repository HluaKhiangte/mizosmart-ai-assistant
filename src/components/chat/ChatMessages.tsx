import { useState } from "react";
import { Message } from "@/pages/Chat";
import { Bot, User, Copy, Check, Pencil, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Props {
  messages: Message[];
  isStreaming: boolean;
  onEditMessage?: (id: string, newContent: string) => void;
  onCartoonify?: (imageBase64: string) => void;
}

const ChatMessages = ({ messages, isStreaming, onEditMessage, onCartoonify }: Props) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const saveEdit = () => {
    if (editingId && editContent.trim() && onEditMessage) {
      onEditMessage(editingId, editContent.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

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

  // Check if content contains a base64 image
  const extractImage = (content: string) => {
    const match = content.match(/!\[.*?\]\((data:image\/[^)]+)\)/);
    return match ? match[1] : null;
  };

  // Render user content with inline images
  const renderUserContent = (content: string) => {
    const imgRegex = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      parts.push(
        <img key={match.index} src={match[2]} alt={match[1] || "image"} className="rounded-xl max-w-full max-h-72 object-contain my-2" loading="lazy" />
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    return parts.length > 0 ? <>{parts}</> : content;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {messages.map((msg) => {
        const imageInContent = msg.role === "assistant" ? extractImage(msg.content) : null;

        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`group flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div className="flex flex-col max-w-[85%]">
              {editingId === msg.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[60px] p-3 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 text-xs rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-chat-ai text-chat-ai-foreground rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-2">
                      <ReactMarkdown
                        components={{
                          img: ({ src, alt }) => (
                            <img src={src} alt={alt || "image"} className="rounded-xl max-w-full max-h-72 object-contain" loading="lazy" />
                          ),
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    renderUserContent(msg.content)
                  )}
                </div>
              )}

              {/* Action buttons */}
              {editingId !== msg.id && (
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Copy"
                  >
                    {copiedId === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                  {msg.role === "user" && onEditMessage && (
                    <button
                      onClick={() => startEdit(msg)}
                      className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                  {msg.role === "assistant" && imageInContent && onCartoonify && (
                    <button
                      onClick={() => onCartoonify(imageInContent)}
                      className="h-6 px-2 rounded flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs"
                      title="Cartoonify"
                    >
                      <Wand2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
            )}
          </motion.div>
        );
      })}
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
