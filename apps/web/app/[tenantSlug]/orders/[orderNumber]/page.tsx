import Link from "next/link";
import { Badge, Button, Card } from "@guma-commerce/ui";

interface PageProps {
  params: Promise<{ tenantSlug: string; orderNumber: string }>;
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const { tenantSlug, orderNumber } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-lg space-y-4">
        <Card className="text-center">
          <div className="text-4xl">✅</div>
          <h1 className="mt-3 text-xl font-bold">Order Confirmed!</h1>
          <p className="mt-1 text-gray-500">Order #{orderNumber}</p>
          <Badge className="mt-3">SMS sent to your phone</Badge>
        </Card>

        <Card>
          <h2 className="font-semibold">Delivery status</h2>
          <ol className="mt-4 space-y-4">
            {[
              { label: "Order placed", done: true },
              { label: "Payment confirmed", done: true },
              { label: "Preparing your order", done: true, active: true },
              { label: "Rider assigned", done: false },
              { label: "Out for delivery", done: false },
              { label: "Delivered", done: false },
            ].map((step) => (
              <li key={step.label} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                    step.done
                      ? "bg-emerald-600 text-white"
                      : step.active
                        ? "bg-amber-100 text-amber-700 ring-2 ring-amber-400"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step.done ? "✓" : "·"}
                </div>
                <span className={step.done || step.active ? "font-medium" : "text-gray-400"}>
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Estimated delivery</p>
          <p className="text-lg font-bold">35–45 minutes</p>
          <p className="mt-2 text-sm text-emerald-700">Lalamove · ASSIGNING_DRIVER</p>
        </Card>

        <Link href={`/${tenantSlug}`}>
          <Button variant="secondary" className="w-full">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
