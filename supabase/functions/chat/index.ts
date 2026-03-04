import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are MizoSmart AI, a helpful, intelligent assistant that is fluent in both Mizo and English. You understand Mizo cultural context, traditions, history, and slang.

Key behaviors:
- If the user writes in Mizo, respond in Mizo. If they write in English, respond in English. You can mix both naturally.
- Be warm, respectful, and culturally aware.
- You understand Mizo expressions like "a nuam", "a va mak em", "engtin nge", etc.
- You can discuss Mizo history, culture, food (like bai, sawhchiar), festivals (Chapchar Kut, Pawl Kut), and geography.
- Be concise but thorough. Use markdown formatting when helpful.
- Always be helpful and positive.
- When analyzing images, describe what you see in detail, identify objects, text, scenes, and provide helpful context.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build messages array with optional image
    const aiMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    for (const msg of messages) {
      if (msg.role === "user" && msg.imageBase64) {
        // Multimodal message with image
        aiMessages.push({
          role: "user",
          content: [
            { type: "text", text: msg.content || "What's in this image?" },
            {
              type: "image_url",
              image_url: { url: msg.imageBase64 },
            },
          ],
        });
      } else {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
