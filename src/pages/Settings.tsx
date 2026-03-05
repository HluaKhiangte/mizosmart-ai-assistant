import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  const handleClearHistory = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setClearing(true);
    try {
      // Get all user chats
      const { data: chats } = await supabase
        .from("chats")
        .select("id")
        .eq("user_id", user!.id);

      if (chats && chats.length > 0) {
        const chatIds = chats.map((c) => c.id);
        await supabase.from("messages").delete().in("chat_id", chatIds);
        await supabase.from("chats").delete().eq("user_id", user!.id);
      }
      toast.success("Chat history cleared!");
      setConfirmClear(false);
    } catch {
      toast.error("Failed to clear history");
    } finally {
      setClearing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-lg gradient-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-sm mx-auto">
        <button
          onClick={() => navigate("/chat")}
          className="flex items-center gap-1 text-muted-foreground text-sm mb-8 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </button>

        <h1 className="font-display text-2xl font-bold mb-8">Settings</h1>

        {/* Account section */}
        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account</h2>
          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate("/profile")}
            >
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Data section */}
        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Data</h2>
          <div className="bg-card rounded-xl border border-border p-4">
            {confirmClear && (
              <div className="flex items-center gap-2 text-destructive text-sm mb-3 p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                This will permanently delete all chats. Tap again to confirm.
              </div>
            )}
            <Button
              variant={confirmClear ? "destructive" : "outline"}
              className="w-full justify-start gap-2"
              onClick={handleClearHistory}
              disabled={clearing}
            >
              <Trash2 className="h-4 w-4" />
              {clearing ? "Clearing..." : confirmClear ? "Confirm Clear All" : "Clear Chat History"}
            </Button>
          </div>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Settings;
