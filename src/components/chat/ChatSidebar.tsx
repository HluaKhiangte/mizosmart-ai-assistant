import { Chat } from "@/pages/Chat";
import { Plus, Trash2, Pencil, MessageSquare } from "lucide-react";
import { useState } from "react";

interface Props {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
}

const ChatSidebar = ({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEdit = (chat: Chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) onRenameChat(id, editTitle.trim());
    setEditingId(null);
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full h-10 rounded-lg border border-border flex items-center justify-center gap-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto chat-scrollbar px-2 pb-2">
        <p className="text-xs text-muted-foreground px-2 mb-2 font-medium">History</p>
        {chats.length === 0 && (
          <p className="text-xs text-muted-foreground px-2">No conversations yet</p>
        )}
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group flex items-center gap-2 rounded-lg px-2 py-2 mb-0.5 cursor-pointer transition-colors ${
              activeChatId === chat.id ? "bg-accent" : "hover:bg-accent/50"
            }`}
            onClick={() => onSelectChat(chat.id)}
          >
            <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
            {editingId === chat.id ? (
              <input
                className="flex-1 text-sm bg-transparent border-b border-primary outline-none min-w-0"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => saveEdit(chat.id)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(chat.id)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm truncate">{chat.title}</span>
            )}
            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); startEdit(chat); }}
                className="h-6 w-6 rounded flex items-center justify-center hover:bg-background transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
