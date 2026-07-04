"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { StorefrontStoreSettings } from "@/lib/storefront-settings";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function sessionKey(tenantSlug: string): string {
  return `guma-chat-${tenantSlug}`;
}

export function ShopAssistant({
  tenantSlug,
  shopName,
  assistant,
}: {
  tenantSlug: string;
  shopName: string;
  assistant: StorefrontStoreSettings["shopAssistant"];
}) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(sessionKey(tenantSlug));
    const id = stored ?? crypto.randomUUID();
    localStorage.setItem(sessionKey(tenantSlug), id);
    setSessionId(id);
    setMessages([
      {
        id: "greeting",
        role: "assistant",
        content: assistant.greeting.replace("{shop}", shopName),
      },
    ]);
  }, [tenantSlug, shopName, assistant.greeting]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  if (!assistant.enabled) return null;

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !sessionId) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          sessionId,
          message: text,
        }),
      });
      const data = await res.json();
      const reply =
        typeof data.reply === "string"
          ? data.reply
          : "Sorry, I couldn't reach the shop assistant. Please try again or checkout directly.";

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition hover:scale-105 md:bottom-8"
        aria-label={`Chat with ${assistant.name}`}
      >
        <MessageCircle className="h-7 w-7" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-end p-4 md:items-end md:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-[min(560px,85vh)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <div>
                <p className="font-semibold text-neutral-900">{assistant.name}</p>
                <p className="text-xs text-neutral-500">{shopName} · pre-checkout help</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && (
                <p className="text-xs text-neutral-400">Assistant is typing…</p>
              )}
            </div>

            <form
              className="border-t border-neutral-100 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about products, delivery, payment…"
                  className="h-11 flex-1 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-400"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
