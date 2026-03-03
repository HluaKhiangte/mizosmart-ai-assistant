import { motion } from "framer-motion";
import { Bot, ArrowRight, Sparkles, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleStart = () => {
    navigate(user ? "/chat" : "/auth");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="glass-strong fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">MizoSmart AI</span>
          </div>
          <button
            onClick={toggleTheme}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-12">
        <div className="max-w-xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto mb-6 h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
              <Bot className="h-10 w-10 text-primary-foreground" />
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              <span className="text-gradient">MizoSmart</span>{" "}
              <span className="text-foreground">AI</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-md mx-auto leading-relaxed">
              Your intelligent assistant fluent in Mizo & English. Ask anything, anytime.
            </p>

            <Button variant="hero" size="xl" onClick={handleStart} className="mb-12">
              Start Chatting
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {[
              { icon: Sparkles, title: "Smart AI", desc: "Powered by advanced AI" },
              { icon: MessageSquare, title: "Bilingual", desc: "Mizo & English fluent" },
              { icon: Shield, title: "Secure", desc: "Your data stays private" },
            ].map((f) => (
              <div key={f.title} className="glass rounded-xl p-5 text-center">
                <f.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-display font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-xs">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
