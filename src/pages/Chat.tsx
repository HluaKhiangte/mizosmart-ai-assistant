import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import { Bot, Menu, Moon, Sun, LogOut, UserCircle, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface Chat {
  id: string;
  title: string;
  created_at: string;
}

const ChatPage = () => {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    loadChats();
  }, [user]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    loadMessages(activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChats = async () => {
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setChats(data);
  };

  const loadMessages = async (chatId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
    }
  };

  const createChat = async (firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    const { data, error } = await supabase
      .from("chats")
      .insert({ user_id: user!.id, title })
      .select()
      .single();
    if (error || !data) {
      toast.error("Failed to create chat");
      return null;
    }
    setChats((prev) => [data, ...prev]);
    setActiveChatId(data.id);
    return data.id;
  };

  const sendMessage = async (content: string, imageBase64?: string) => {
    if ((!content.trim() && !imageBase64) || isStreaming) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = await createChat(content || "Image analysis");
      if (!chatId) return;
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);

    await supabase.from("messages").insert({ chat_id: chatId, role: "user", content });

    setIsStreaming(true);
    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    try {
      const allMessages = [...messages, userMsg].map((m, i) => {
        const msgData: any = { role: m.role, content: m.content };
        if (i === messages.length && imageBase64) {
          msgData.imageBase64 = imageBase64;
        }
        return msgData;
      });

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages }),
        }
      );

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limited. Please try again in a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Failed to get AI response");
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ") || line.trim() === "" || line.startsWith(":")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id === assistantId) {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { id: assistantId, role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (assistantContent) {
        await supabase.from("messages").insert({
          chat_id: chatId,
          role: "assistant",
          content: assistantContent,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsStreaming(false);
    }
  };

  const editMessage = async (msgId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, content: newContent } : m))
    );
    // Update in DB
    await supabase.from("messages").update({ content: newContent }).eq("id", msgId);
  };

  const handleCartoonify = async (imageBase64: string) => {
    if (isStreaming) return;
    setIsStreaming(true);

    let chatId = activeChatId;
    if (!chatId) {
      chatId = await createChat("Cartoonify image");
      if (!chatId) { setIsStreaming(false); return; }
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: "🎨 Convert this image to cartoon style" };
    setMessages((prev) => [...prev, userMsg]);
    await supabase.from("messages").insert({ chat_id: chatId, role: "user", content: userMsg.content });

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cartoonify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64 }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || "Failed to cartoonify");
        setIsStreaming(false);
        return;
      }

      const data = await resp.json();
      let assistantContent = data.text || "Here's your cartoon version!";
      if (data.imageUrl) {
        assistantContent += `\n\n![Cartoon](${data.imageUrl})`;
      }

      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: assistantContent };
      setMessages((prev) => [...prev, assistantMsg]);
      await supabase.from("messages").insert({ chat_id: chatId, role: "assistant", content: assistantContent });
    } catch (err) {
      console.error(err);
      toast.error("Failed to cartoonify image");
    } finally {
      setIsStreaming(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    await supabase.from("messages").delete().eq("chat_id", chatId);
    await supabase.from("chats").delete().eq("id", chatId);
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    await supabase.from("chats").update({ title: newTitle }).eq("id", chatId);
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
    );
  };

  const newChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-lg gradient-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed md:relative z-50 h-full transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } w-72 md:w-64`}
      >
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(id) => {
            setActiveChatId(id);
            setSidebarOpen(false);
          }}
          onNewChat={newChat}
          onDeleteChat={deleteChat}
          onRenameChat={renameChat}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="glass-strong h-14 flex items-center px-4 gap-3 shrink-0 border-b border-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">MizoSmart AI</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => navigate("/profile")}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
          >
            <UserCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={toggleTheme}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button
            onClick={signOut}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto chat-scrollbar">
          <ChatMessages
            messages={messages}
            isStreaming={isStreaming}
            onEditMessage={editMessage}
            onCartoonify={handleCartoonify}
          />
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={sendMessage} onCartoonify={handleCartoonify} disabled={isStreaming} />
      </div>
    </div>
  );
};

export default ChatPage;
