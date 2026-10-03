/**
 * Courier statuses → Guma Kart fulfillment states (docs/PHASE-2-MIGRATION-SPEC.md §2.2).
 *
 * The order service applies these with source "courier": forward-only, so a
 * late or replayed webhook can never move an order backwards. A courier that
 * cancels a booking before pickup sends the order back to "ready" for the
 * seller to rebook — it never cancels the order.
 */
export type CourierFulfillment =
  | "booked"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "failed_delivery"
  | "returned"
  | "booking_cancelled";

const LALAMOVE: Record<string, CourierFulfillment> = {
  ASSIGNING_DRIVER: "booked",
  ON_GOING: "booked", // driver accepted, heading to pickup
  PICKED_UP: "out_for_delivery",
  COMPLETED: "delivered",
  CANCELED: "booking_cancelled",
  CANCELLED: "booking_cancelled",
  REJECTED: "booking_cancelled",
  EXPIRED: "booking_cancelled",
};

const GRAB: Record<string, CourierFulfillment> = {
  ALLOCATING: "booked",
  PENDING_PICKUP: "booked",
  PICKING_UP: "booked",
  COLLECTED: "picked_up",
  IN_DELIVERY: "out_for_delivery",
  IN_PROGRESS: "out_for_delivery",
  COMPLETED: "delivered",
  DELIVERED: "delivered",
  FAILED: "failed_delivery",
  RETURNED: "returned",
  CANCELED: "booking_cancelled",
  CANCELLED: "booking_cancelled",
};

export function lalamoveFulfillment(status: string | undefined | null): CourierFulfillment | null {
  return status ? LALAMOVE[status.toUpperCase()] ?? null : null;
}

export function grabFulfillment(status: string | undefined | null): CourierFulfillment | null {
  return status ? GRAB[status.toUpperCase()] ?? null : null;
}

export const COURIER_NOTES: Record<CourierFulfillment, string> = {
  booked: "Rider booked",
  picked_up: "Rider picked up your order",
  out_for_delivery: "Your order is on the way",
  delivered: "Delivered",
  failed_delivery: "Delivery attempt failed",
  returned: "Order returned to the shop",
  booking_cancelled: "Courier cancelled the booking — rebook the delivery",
};
