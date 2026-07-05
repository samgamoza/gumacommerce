"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircle, Send, Sparkles, X } from "lucide-react"

type Msg = { id: number; from: "bot" | "me"; text: string }

const initialMessages: Msg[] = [
  {
    id: 1,
    from: "bot",
    text: "Hi there! 👋 I'm Guma's AI assistant. Ask me about products, orders, or today's deals.",
  },
]

const quickReplies = ["Track my order", "What's on sale?", "Sizing help"]

const botReply = (text: string) => {
  const t = text.toLowerCase()
  if (t.includes("track") || t.includes("order"))
    return "Your last order #SK-2048 is out for delivery and arrives today by 6 PM 🚚"
  if (t.includes("sale") || t.includes("deal"))
    return "Today's flash deals are up to 40% off — the Coral Runner Sneakers and Cloud Headphones are going fast! ⚡"
  if (t.includes("size") || t.includes("sizing"))
    return "Most of our fashion items run true to size. Tell me the product and I'll pull the size chart for you 📏"
  return "Got it! A seller will follow up shortly. Meanwhile, you can add items to your cart and check out in one tap 💳"
}

export function MessengerWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [input, setInput] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const myId = Date.now()
    setMessages((prev) => [...prev, { id: myId, from: "me", text: trimmed }])
    setInput("")
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: myId + 1, from: "bot", text: botReply(trimmed) }])
    }, 700)
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-foreground/10 sm:inset-x-auto sm:right-6 sm:w-[22rem]">
          <div className="flex items-center gap-3 bg-foreground p-4 text-background">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4.5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Guma Messenger</p>
              <p className="flex items-center gap-1.5 text-xs text-background/70">
                <span className="size-1.5 rounded-full bg-accent" /> Typically replies instantly
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex size-8 items-center justify-center rounded-full text-background/80 transition-colors hover:bg-background/15"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/40 p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.from === "me"
                    ? "ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                    : "mr-auto w-fit max-w-[80%] rounded-2xl rounded-bl-sm bg-card px-3.5 py-2 text-sm text-card-foreground shadow-sm"
                }
              >
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border bg-card p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
                aria-label="Message"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Messenger" : "Open Messenger"}
        className="animate-pulse-ring fixed bottom-6 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-90 sm:right-6"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  )
}
