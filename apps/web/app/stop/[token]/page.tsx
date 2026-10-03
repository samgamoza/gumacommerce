import type { Metadata } from "next";
import { verifyOptOutToken } from "@gumakart/services";
import { Button, Card } from "@gumakart/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Stop SMS reminders",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; error?: string }>;
}

function maskPhone(phone: string): string {
  return phone.length >= 7 ? `${phone.slice(0, 4)}•••${phone.slice(-3)}` : "your number";
}

/** Landing page for the "Stop reminders" link in reminder SMS. */
export default async function StopRemindersPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { done, error } = await searchParams;
  const phone = verifyOptOutToken(token);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md pt-10">
        <Card className="text-center">
          {!phone || error === "invalid" ? (
            <>
              <div className="text-4xl">🔗</div>
              <h1 className="mt-3 text-xl font-bold">This link isn&apos;t valid</h1>
              <p className="mt-2 text-sm text-gray-600">
                Please use the link exactly as it appears in the text message.
              </p>
            </>
          ) : done ? (
            <>
              <div className="text-4xl">✅</div>
              <h1 className="mt-3 text-xl font-bold">Reminders stopped</h1>
              <p className="mt-2 text-sm text-gray-600">
                We won&apos;t send reminder texts to {maskPhone(phone)} from any Guma Kart shop.
                You&apos;ll still get updates about orders you place (payment confirmed, out for
                delivery).
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl">🔕</div>
              <h1 className="mt-3 text-xl font-bold">Stop reminder texts?</h1>
              <p className="mt-2 text-sm text-gray-600">
                {maskPhone(phone)} will stop getting reminders (like unfinished checkouts) from
                every Guma Kart shop. Order updates still arrive.
              </p>
              {error === "busy" ? (
                <p className="mt-3 text-sm text-red-600">Too many tries — wait a minute and try again.</p>
              ) : null}
              <form method="post" action="/api/sms/opt-out" className="mt-5">
                <input type="hidden" name="token" value={token} />
                <Button type="submit">Stop reminders</Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
