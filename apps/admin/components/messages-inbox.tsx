"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@guma-commerce/ui";
import { storefrontUrl } from "@/lib/utils";

type SessionRow = {
  sessionId: string;
  lastMessage: string;
  lastRole: string;
  lastAt: string;
  messageCount: number;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

function threadLabel(session: SessionRow): string {
  const orderMatch = session.lastMessage.match(/\[Order\s+([^\]]+)\]/i);
  if (orderMatch?.[1]) return `Order ${orderMatch[1]}`;
  const buyerBits = session.lastMessage.replace(/^\[Order[^\]]+\]\s*/i, "").trim();
  if (buyerBits.length > 0) return buyerBits.slice(0, 42) + (buyerBits.length > 42 ? "…" : "");
  return `Chat ${session.sessionId.slice(0, 8)}`;
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function MessagesInbox({
  shopSlug,
  shopName,
}: {
  shopSlug?: string;
  shopName?: string;
}) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "Could not load inbox.");
      setLoading(false);
      return;
    }
    setSessions(
      (data.sessions ?? []).map((s: SessionRow & { lastAt: string | Date }) => ({
        ...s,
        lastAt: typeof s.lastAt === "string" ? s.lastAt : new Date(s.lastAt).toISOString(),
      }))
    );
    setLoading(false);
  }, []);

  const loadThread = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/messages?sessionId=${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    if (!data.ok) return;
    setMessages(data.messages ?? []);
  }, []);

  useEffect(() => {
    void loadSessions();
    const timer = window.setInterval(() => void loadSessions(), 8000);
    return () => window.clearInterval(timer);
  }, [loadSessions]);

  useEffect(() => {
    if (!active) return;
    void loadThread(active);
    const timer = window.setInterval(() => void loadThread(active), 4000);
    return () => window.clearInterval(timer);
  }, [active, loadThread]);

  async function sendReply() {
    if (!active || !draft.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: active, message: draft.trim() }),
    });
    const data = await res.json();
    setSending(false);
    if (!data.ok) {
      setError(data.error ?? "Send failed.");
      return;
    }
    setDraft("");
    await loadThread(active);
    await loadSessions();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading inbox…</p>;
  }

  const shopHref = shopSlug ? storefrontUrl(shopSlug) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="overflow-hidden border-white/10 bg-white/[0.03] p-0">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Conversations</h2>
          <p className="text-xs text-slate-500">Buyer storefront chat · refreshes often</p>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="space-y-3 p-4 text-sm text-slate-400">
              <p className="font-medium text-slate-200">No chats yet</p>
              <p>
                When a buyer taps <span className="text-slate-200">Message seller</span> on your
                shop or order page, the thread appears here.
              </p>
              <ol className="list-decimal space-y-1 pl-4 text-xs">
                <li>Open your live shop</li>
                <li>Use the chat bubble → Message seller</li>
                <li>Send a test note — it should show up in this inbox</li>
              </ol>
              {shopHref ? (
                <a
                  href={shopHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-xs font-medium text-slate-200 underline underline-offset-2"
                >
                  Open {shopName ?? "your shop"} →
                </a>
              ) : null}
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.sessionId}
                type="button"
                onClick={() => setActive(session.sessionId)}
                className={`block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/[0.04] ${
                  active === session.sessionId ? "bg-white/[0.07]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {threadLabel(session)}
                  </p>
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {formatWhen(session.lastAt)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{session.lastMessage}</p>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="flex min-h-[420px] flex-col border-white/10 bg-white/[0.03] p-0">
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-400">
            <p className="font-medium text-slate-200">Select a conversation to reply</p>
            <p className="max-w-sm text-xs">
              Use this inbox for payment refs, order changes, and product questions. Replies show
              in the buyer’s shop chat.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-slate-100">
                {threadLabel(
                  sessions.find((s) => s.sessionId === active) ?? {
                    sessionId: active,
                    lastMessage: "",
                    lastRole: "",
                    lastAt: "",
                    messageCount: 0,
                  }
                )}
              </p>
              <p className="text-xs text-slate-500">
                Buyer sees your reply in the storefront chat widget.
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => {
                const seller = message.role === "seller";
                const buyer = message.role === "buyer" || message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex ${seller ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        seller
                          ? "bg-emerald-600 text-white"
                          : buyer
                            ? "bg-white/10 text-slate-100"
                            : "bg-amber-400/10 text-amber-100"
                      }`}
                    >
                      <p className="mb-0.5 text-[10px] uppercase opacity-70">
                        {seller ? "You" : buyer ? "Buyer" : "Assistant"}
                      </p>
                      {message.content}
                    </div>
                  </div>
                );
              })}
            </div>
            {error ? <p className="px-4 text-sm text-red-400">{error}</p> : null}
            <form
              className="flex gap-2 border-t border-white/10 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void sendReply();
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Reply to buyer…"
                className="h-10 flex-1 rounded-lg border border-white/10 bg-guma-navy/50 px-3 text-sm text-slate-100"
              />
              <Button type="submit" disabled={sending || !draft.trim()}>
                Send
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
