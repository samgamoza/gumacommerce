"use client";

import { useCallback, useEffect, useState } from "react";
import { SettingsPageLayout } from "@/components/settings/settings-shell";
import { SettingsCard, inputClassName, textareaClassName } from "@/components/settings/settings-forms";

const SUPPORT_EMAIL = "support@gumacommerce.ph";

interface TicketRow {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
}

export function SupportSettingsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [body, setBody] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (data.ok) setTickets(data.tickets);
      else setError(data.error ?? "Could not load tickets.");
    } catch {
      setError("Could not load tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, priority, body }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not create ticket.");
        return;
      }
      setNotice(`Ticket ${data.ticketNumber} created. We’ll reply within one business day.`);
      setSubject("");
      setBody("");
      await load();
    } catch {
      setError("Network error creating ticket.");
    } finally {
      setSaving(false);
    }
  }

  async function sendReply() {
    if (!activeId || !reply.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: activeId, body: reply }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not send reply.");
        return;
      }
      setNotice("Reply sent.");
      setReply("");
      setActiveId(null);
      await load();
    } catch {
      setError("Network error sending reply.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPageLayout
      title="Help & support"
      description="Open a tracked ticket with the Guma team — billing, delivery, KYC, and account help."
    >
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {notice && <p className="mb-3 text-sm text-emerald-700">{notice}</p>}

      <SettingsCard title="New ticket">
        <form onSubmit={createTicket} className="space-y-3">
          <input
            className={inputClassName()}
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={4}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className={inputClassName()}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">General</option>
              <option value="billing">Billing & subscription</option>
              <option value="delivery">Delivery / couriers</option>
              <option value="account">Account / KYC</option>
              <option value="technical">Technical</option>
            </select>
            <select
              className={inputClassName()}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <textarea
            className={textareaClassName()}
            rows={5}
            placeholder="Describe the issue — include order numbers if relevant."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            minLength={10}
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Submitting…" : "Submit ticket"}
          </button>
        </form>
      </SettingsCard>

      <SettingsCard title="Your tickets">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((t) => (
              <li key={t.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      <span className="font-mono text-xs text-muted-foreground">
                        {t.ticketNumber}
                      </span>{" "}
                      {t.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.status.replace("_", " ")} · {t.priority} · {t.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-emerald-700 hover:underline"
                    onClick={() => setActiveId(activeId === t.id ? null : t.id)}
                  >
                    {activeId === t.id ? "Cancel" : "Add update"}
                  </button>
                </div>
                {activeId === t.id && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      className={textareaClassName()}
                      rows={3}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Add more detail for the support team…"
                    />
                    <button
                      type="button"
                      disabled={saving || !reply.trim()}
                      onClick={() => sendReply()}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                    >
                      Send update
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      <SettingsCard title="Also available">
        <p className="text-sm text-muted-foreground">
          Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-emerald-700 underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          · Buyer chat stays in Messages · Common links:{" "}
          <a href="/settings/subscription" className="text-emerald-700 hover:underline">
            Subscription
          </a>
          ,{" "}
          <a href="/settings/wallet" className="text-emerald-700 hover:underline">
            Wallet
          </a>
          ,{" "}
          <a href="/settings/kyc" className="text-emerald-700 hover:underline">
            KYC
          </a>
          .
        </p>
      </SettingsCard>
    </SettingsPageLayout>
  );
}
