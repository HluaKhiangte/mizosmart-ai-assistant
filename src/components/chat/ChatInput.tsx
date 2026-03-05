import { useState, useRef } from "react";
import { Send, ImagePlus, X, Wand2 } from "lucide-react";

interface Props {
  onSend: (message: string, imageBase64?: string) => void;
  onCartoonify?: (imageBase64: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, onCartoonify, disabled }: Props) => {
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !imageBase64) || disabled) return;
    onSend(input.trim() || "What's in this image?", imageBase64 || undefined);
    setInput("");
    setImagePreview(null);
    setImageBase64(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
  };

  const handleCartoonify = () => {
    if (imageBase64 && onCartoonify) {
      onCartoonify(imageBase64);
      setImagePreview(null);
      setImageBase64(null);
    }
  };

  return (
    <div className="border-t border-border p-3 bg-background">
      <div className="max-w-2xl mx-auto">
        {imagePreview && (
          <div className="mb-2 flex items-end gap-2">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="h-20 w-20 rounded-lg object-cover border border-border"
              />
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            {onCartoonify && (
              <button
                onClick={handleCartoonify}
                disabled={disabled}
                className="h-8 px-3 rounded-lg bg-accent text-accent-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Cartoonify
              </button>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            disabled={disabled}
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={imagePreview ? "Ask about this image..." : "Type a message..."}
            className="flex-1 h-11 px-4 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={disabled || (!input.trim() && !imageBase64)}
            className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 transition-opacity active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
