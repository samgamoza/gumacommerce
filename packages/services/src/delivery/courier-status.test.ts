import assert from "node:assert/strict";
import { test } from "node:test";
import { grabFulfillment, lalamoveFulfillment } from "./courier-status";

test("courier statuses map onto fulfillment; cancels are never order cancels", () => {
  assert.equal(lalamoveFulfillment("ASSIGNING_DRIVER"), "booked");
  assert.equal(lalamoveFulfillment("on_going"), "booked");
  assert.equal(lalamoveFulfillment("PICKED_UP"), "out_for_delivery");
  assert.equal(lalamoveFulfillment("COMPLETED"), "delivered");
  assert.equal(lalamoveFulfillment("CANCELED"), "booking_cancelled");
  assert.equal(lalamoveFulfillment("SOMETHING_NEW"), null);
  assert.equal(grabFulfillment("IN_DELIVERY"), "out_for_delivery");
  assert.equal(grabFulfillment("FAILED"), "failed_delivery");
  assert.equal(grabFulfillment("RETURNED"), "returned");
  assert.equal(grabFulfillment("CANCELLED"), "booking_cancelled");
  assert.equal(grabFulfillment(undefined), null);
});
