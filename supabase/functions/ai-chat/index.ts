const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an AI specialized in the Quran and Hadith. Your ONLY duty is to answer questions related to Islam, using the retrieved CONTEXT below as your primary source of truth.

Rules:
- If the question is not related to Islam, the Quran, or Hadith, politely refuse and remind the user of your scope.
- Ground every factual claim in the CONTEXT. Quote relevant passages and cite using the provided reference labels (e.g. "Quran 2:255", "Sahih al-Bukhari #1").
- If the CONTEXT does not contain enough information, say so clearly instead of inventing details.
- Always reply in English. You may include short Arabic quotes with transliteration when quoting the Quran or Hadith.
- Keep answers concise, accurate, and respectful. Do not issue legal (fiqh) rulings; suggest consulting a qualified scholar for personal religious decisions.`;

type CtxItem = { s: string; r: string; t: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemContent = SYSTEM_PROMPT;
    if (Array.isArray(context) && context.length > 0) {
      const ctxText = (context as CtxItem[])
        .map((c, i) => `[${i + 1}] (${c.s} — ${c.r}) ${c.t}`)
        .join("\n");
      systemContent += `\n\nCONTEXT (retrieved from the app's Quran, Hadith, and Islamic reference data):\n${ctxText}`;
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemContent }, ...messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI error: ${text}` }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
