import webpush from "web-push";

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Path to open when the notification is clicked (relative to the admin app). */
  url?: string;
  tag?: string;
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure(): boolean {
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:support@gumacommerce.ph",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return true;
}

/**
 * Sends a push notification to every subscription. Returns endpoints that are
 * permanently dead (410/404) so the caller can prune them from the database.
 */
export async function sendPushNotifications(
  subscriptions: PushSubscriptionRecord[],
  payload: PushPayload
): Promise<{ sent: number; expiredEndpoints: string[] }> {
  if (subscriptions.length === 0 || !configure()) {
    return { sent: 0, expiredEndpoints: [] };
  }

  const body = JSON.stringify(payload);
  const expiredEndpoints: string[] = [];
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: 60 * 60 }
        );
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.error("[push] Send failed:", error);
        }
      }
    })
  );

  return { sent, expiredEndpoints };
}
