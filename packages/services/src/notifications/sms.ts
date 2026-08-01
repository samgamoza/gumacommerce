const SEMAPHORE_API = "https://api.semaphore.co/api/v4/messages";

export interface SendSmsInput {
  to: string;
  message: string;
  priority?: boolean;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  mock?: boolean;
}

export class SemaphoreClient {
  constructor(private apiKey: string) {}

  async send(input: SendSmsInput): Promise<SendSmsResult> {
    if (!this.apiKey) {
      console.info("[SMS Mock]", input.to, input.message);
      return { success: true, messageId: `sms_mock_${Date.now()}`, mock: true };
    }

    const body = new URLSearchParams({
      apikey: this.apiKey,
      number: input.to.replace(/^\+63/, "0").replace(/\D/g, ""),
      message: input.message,
      ...(input.priority ? { priority: "true" } : {}),
    });

    const res = await fetch(SEMAPHORE_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      throw new Error(`Semaphore SMS failed: ${await res.text()}`);
    }

    const json = (await res.json()) as Array<{ message_id: string }>;
    return { success: true, messageId: json[0]?.message_id };
  }

  orderConfirmation(params: {
    to: string;
    orderNumber: string;
    total: string;
    trackingUrl?: string;
  }): Promise<SendSmsResult> {
    const msg = params.trackingUrl
      ? `Guma One: Order ${params.orderNumber} confirmed! Total ${params.total}. Track: ${params.trackingUrl}`
      : `Guma One: Order ${params.orderNumber} confirmed! Total ${params.total}. Salamat po!`;
    return this.send({ to: params.to, message: msg, priority: true });
  }
}

export function createSemaphoreClient(): SemaphoreClient {
  return new SemaphoreClient(process.env.SEMAPHORE_API_KEY ?? "");
}

export function formatPhp(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;
}

export function generateOrderNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix.toUpperCase()}-${date}-${rand}`;
}
