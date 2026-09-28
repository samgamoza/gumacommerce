import { TriggerSetupCard } from "@/components/kart/trigger-setup-card";

export const metadata = { title: "Keyword trigger · Guma Kart" };

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--kart-muted)]">Merchant dashboard</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Set up a “MINE” trigger</h1>
      <p className="mt-1 max-w-xl text-sm text-[color:var(--kart-muted)]">
        One product, one keyword. Arm the listener on a post or live and the bot handles every buyer who comments.
      </p>
      <div className="mt-6">
        <TriggerSetupCard />
      </div>
    </main>
  );
}
