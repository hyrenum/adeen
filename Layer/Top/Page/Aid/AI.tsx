import { useState, useRef, useEffect } from "react";
import { Layout } from "@/Top/Component/Layout/Index";
import { Container } from "@/Top/Component/UI/Container";
import { Button } from "@/Top/Component/UI/Button";
import { Textarea } from "@/Top/Component/UI/Textarea";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/Middle/Hook/Use-Toast";
import { supabase } from "@/Bottom/Integration/Supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;

export default function AI() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => { taRef.current?.focus(); }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "" }]);
    } catch (e) {
      toast({ title: "AI error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
      setTimeout(() => taRef.current?.focus(), 0);
    }
  };

  return (
    <Layout hideFooter>
      <section className="px-4 py-6">
        <div className="container max-w-2xl mx-auto space-y-4">
          <div className="flex justify-center">
            <Container className="!py-1 !px-4 inline-flex w-auto">
              <span className="text-sm font-medium">AI Assistant</span>
            </Container>
          </div>

          <Container className="!p-4 sm:!p-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-foreground text-background flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Ask anything about the Quran or Hadith. English only.
            </p>
          </Container>

          <Container className="!p-0 overflow-hidden">
            <div ref={scrollRef} className="h-[50vh] overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-12">
                  Start the conversation…
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking…
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-border p-3 flex gap-2 items-end">
              <Textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask about the Quran or Hadith…"
                rows={1}
                className="resize-none min-h-[40px] max-h-32"
              />
              <Button onClick={send} disabled={loading || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Container>
        </div>
      </section>
    </Layout>
  );
}
