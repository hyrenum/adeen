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
  X,
  Minus,
  Square,
  MessageSquare,
  Trash2,
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Ensure active id exists
  useEffect(() => {
    if (!activeId || !threads.find((t) => t.id === activeId)) {
      setActiveId(threads[0]?.id ?? "");
    }
  }, [activeId, threads]);

  // Persist
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
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      updateActive((t) => ({
        ...t,
        messages: [...nextMessages, { role: "assistant", content: data.reply || "" }],
        updatedAt: Date.now(),
      }));
    } catch (e) {
      toast({ title: "AI error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
      setTimeout(() => taRef.current?.focus(), 0);
    }
  };

  if (minimized) {
    return (
      <Layout hideFooter>
        <section className="px-4 py-6">
          <div className="container max-w-2xl mx-auto">
            <Container className="!py-2 !px-4 flex items-center justify-between">
              <span className="text-sm font-medium">AI Assistant (minimized)</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => setMinimized(false)} title="Restore">
                  <Square className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Container>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <section className={cn("px-4 py-6", maximized && "px-2 py-2")}>
        <div className={cn("mx-auto", maximized ? "max-w-none" : "container max-w-5xl")}>
          <Container className="!p-0 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    // "close" = clear current chat
                    if (active) updateActive((t) => ({ ...t, messages: [], title: "New chat" }));
                  }}
                  className="w-3 h-3 rounded-full bg-red-500 hover:opacity-80"
                  title="Close (clear chat)"
                  aria-label="Close"
                />
                <button
                  onClick={() => setMinimized(true)}
                  className="w-3 h-3 rounded-full bg-yellow-500 hover:opacity-80"
                  title="Minimize"
                  aria-label="Minimize"
                />
                <button
                  onClick={() => setMaximized((m) => !m)}
                  className="w-3 h-3 rounded-full bg-green-500 hover:opacity-80"
                  title="Maximize"
                  aria-label="Maximize"
                />
              </div>
              <span className="text-xs text-muted-foreground">AI Assistant</span>
              <div className="w-12" />
            </div>

            <div className="flex" style={{ height: maximized ? "calc(100vh - 120px)" : "70vh" }}>
              {/* Sidebar */}
              {sidebarOpen && (
                <aside className="w-64 border-r border-border flex flex-col bg-muted/30">
                  {/* Sidebar top buttons */}
                  <div className="flex items-center gap-1 p-2 border-b border-border">
                    <Button size="sm" variant="ghost" onClick={newChat} title="New chat" className="flex-1">
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowSearch((s) => !s)}
                      title="Search"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSidebarOpen(false)}
                      title="Close sidebar"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  </div>
                  {showSearch && (
                    <div className="p-2 border-b border-border">
                      <Input
                        placeholder="Search chats..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredThreads.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "group flex items-center gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer transition-colors",
                          t.id === activeId ? "bg-accent" : "hover:bg-accent/50"
                        )}
                        onClick={() => setActiveId(t.id)}
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
                      </div>
                    ))}
                    {filteredThreads.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No chats</p>
                    )}
                  </div>
                </aside>
              )}

              {/* Main chat area */}
              <div className="flex-1 flex flex-col min-w-0">
                {!sidebarOpen && (
                  <div className="p-2 border-b border-border">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSidebarOpen(true)}
                      title="Open sidebar"
                    >
                      <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {messages.length === 0 ? (
                  // Empty state: input at top with examples above
                  <div className="flex-1 flex flex-col justify-start p-4 sm:p-6 space-y-4 overflow-y-auto">
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
                    <div className="flex gap-2 items-end">
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
                        className="resize-none min-h-[40px] max-h-32"
                      />
                      <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                              m.role === "user"
                                ? "bg-foreground text-background"
                                : "bg-muted text-foreground"
                            }`}
                          >
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
                        placeholder="Reply..."
                        rows={1}
                        className="resize-none min-h-[40px] max-h-32"
                      />
                      <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Container>
        </div>
      </section>
    </Layout>
  );
}
