import { useState, useRef, useEffect, useMemo } from "react";
import { Layout } from "@/Top/Component/Layout/Index";
import { Container } from "@/Top/Component/UI/Container";
import { Button } from "@/Top/Component/UI/Button";
import { Textarea } from "@/Top/Component/UI/Textarea";
import { Input } from "@/Top/Component/UI/Input";
import {
  Send,
  Loader2,
  Plus,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Trash2,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy,
} from "lucide-react";
import { toast } from "@/Middle/Hook/Use-Toast";
import { supabase } from "@/Bottom/Integration/Supabase/client";
import { cn } from "@/Middle/Library/utils";

type Msg = { role: "user" | "assistant"; content: string };
type Thread = { id: string; title: string; messages: Msg[]; updatedAt: number };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;
const STORAGE_KEY = "ai-threads-v1";

const EXAMPLES = [
  "What does Surah Al-Fatihah mean?",
  "Summarize a hadith about kindness.",
  "Explain the pillars of Islam.",
  "Give me a short dua before sleeping.",
];

function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Thread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeThread(): Thread {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    updatedAt: Date.now(),
  };
}

export default function AI() {
  const [threads, setThreads] = useState<Thread[]>(() => {
    const existing = loadThreads();
    if (existing.length > 0) return existing;
    return [makeThread()];
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const existing = loadThreads();
    return existing[0]?.id ?? "";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!activeId || !threads.find((t) => t.id === activeId)) {
      setActiveId(threads[0]?.id ?? "");
    }
  }, [activeId, threads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch {}
  }, [threads]);

  const active = threads.find((t) => t.id === activeId) || threads[0];
  const messages = active?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    taRef.current?.focus();
  }, [activeId]);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [threads, search]);

  const newChat = () => {
    const t = makeThread();
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setInput("");
  };

  const deleteThread = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const fresh = makeThread();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const updateActive = (updater: (t: Thread) => Thread) => {
    setThreads((prev) => prev.map((t) => (t.id === activeId ? updater(t) : t)));
  };

  const sendMessages = async (msgs: Msg[]) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: msgs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      updateActive((t) => ({
        ...t,
        messages: [...msgs, { role: "assistant", content: data.reply || "" }],
        updatedAt: Date.now(),
      }));
    } catch (e) {
      toast({ title: "AI error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
      setTimeout(() => taRef.current?.focus(), 0);
    }
  };

  const send = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || loading || !active) return;
    const nextMessages: Msg[] = [...active.messages, { role: "user", content: value }];
    updateActive((t) => ({
      ...t,
      messages: nextMessages,
      title: t.messages.length === 0 ? value.slice(0, 40) : t.title,
      updatedAt: Date.now(),
    }));
    setInput("");
    await sendMessages(nextMessages);
  };

  const regenerate = async () => {
    if (!active || loading) return;
    // drop last assistant message and resend
    const msgs = [...active.messages];
    if (msgs.length === 0) return;
    if (msgs[msgs.length - 1].role === "assistant") msgs.pop();
    if (msgs.length === 0) return;
    updateActive((t) => ({ ...t, messages: msgs, updatedAt: Date.now() }));
    await sendMessages(msgs);
  };

  const isEmpty = messages.length === 0;

  const composer = (
    <div className="w-full">
      <Container className="!p-2 flex gap-2 items-end">
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
          placeholder="Ask anything..."
          rows={1}
          className="resize-none min-h-[40px] max-h-32 border-0 bg-transparent focus-visible:ring-0 shadow-none"
        />
        <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="rounded-full">
          <Send className="h-4 w-4" />
        </Button>
      </Container>
      {!isEmpty && (
        <div className="flex items-center justify-center gap-1 mt-2">
          <Button size="sm" variant="ghost" onClick={regenerate} disabled={loading} className="h-7 px-2 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" /> Regenerate
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => {
              const last = [...messages].reverse().find((m) => m.role === "assistant");
              if (last) {
                navigator.clipboard.writeText(last.content);
                toast({ title: "Copied" });
              }
            }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast({ title: "Thanks for the feedback" })}>
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast({ title: "Thanks for the feedback" })}>
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Layout hideFooter>
      <div className="flex gap-3 w-full" style={{ height: "calc(100vh - 6rem)" }}>
        {/* Sidebar */}
        <aside className={cn("flex flex-col shrink-0 transition-all duration-200", sidebarCollapsed ? "w-12" : "w-60")}>
          {/* 3 buttons row */}
          <div className="flex items-center gap-1 mb-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            {!sidebarCollapsed && (
              <>
                <Button size="icon" variant="ghost" onClick={() => setShowSearch((s) => !s)} title="Search">
                  <Search className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={newChat} title="New chat">
                  <Plus className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {!sidebarCollapsed && showSearch && (
            <Input
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs mb-2"
            />
          )}

          {/* Chats as plain buttons */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredThreads.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-xl px-2 py-2 text-sm cursor-pointer transition-colors",
                  t.id === activeId ? "bg-accent" : "hover:bg-accent/50",
                  sidebarCollapsed && "justify-center"
                )}
                title={t.title}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">{t.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThread(t.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {!sidebarCollapsed && filteredThreads.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No chats</p>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {isEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-6">
              <div className="w-full max-w-2xl space-y-4">
                {composer}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => send(ex)}
                      className="text-left text-sm rounded-2xl border border-border px-3 py-2 hover:bg-accent transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    {m.role === "user" ? (
                      <div className="max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap bg-primary text-primary-foreground">
                        {m.content}
                      </div>
                    ) : (
                      <div className="max-w-[85%] text-sm whitespace-pre-wrap text-foreground">
                        {m.content}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking…
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-2">{composer}</div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
