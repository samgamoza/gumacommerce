"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { company } from "@/lib/site-content";

const TOPICS = [
  "I want to become a seller",
  "I need technical support",
  "Partnership inquiry",
  "Press / media",
  "Other",
] as const;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          topic,
          message,
          category:
            topic.includes("seller")
              ? "sales"
              : topic.includes("support")
                ? "technical"
                : topic.includes("Partnership")
                  ? "partnership"
                  : "general",
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not submit. Try email instead.");
        return;
      }
      setTicketNumber(data.ticketNumber);
      setMessage("");
    } catch {
      setError("Network error. Email us directly if this keeps happening.");
    } finally {
      setSaving(false);
    }
  }

  if (ticketNumber) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
        <p className="font-semibold text-emerald-900">Ticket {ticketNumber} created</p>
        <p className="text-emerald-800/90">
          Thanks {name.trim() || "there"} — we typically reply within one business day to{" "}
          {email}. Keep this ticket number for follow-up.
        </p>
        <button
          type="button"
          className="text-xs font-medium text-emerald-800 underline"
          onClick={() => setTicketNumber(null)}
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        autoComplete="name"
        required
        className="h-11 w-full rounded-xl border border-border/60 bg-muted/30 px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      />
      <input
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        type="email"
        autoComplete="email"
        required
        className="h-11 w-full rounded-xl border border-border/60 bg-muted/30 px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      />
      <select
        name="topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="h-11 w-full rounded-xl border border-border/60 bg-muted/30 px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      >
        {TOPICS.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <textarea
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="How can we help?"
        rows={5}
        required
        className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Creating ticket…" : "Create support ticket"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Creates a tracked ticket for the Guma team. You can also email{" "}
        <a href={`mailto:${company.email}`} className="text-primary hover:underline">
          {company.email}
        </a>
        .
      </p>
    </form>
  );
}
