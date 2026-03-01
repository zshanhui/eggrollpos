import { addMinutes, parseJSON } from "date-fns";

export type OrderStatus =
  | "waiting_for_acceptance"
  | "accepted"
  | "preparing"
  | "ready_for_pickup"
  | "ready_for_delivery"
  | "pickup_success"
  | "delivery_in_progress"
  | "delivered"
  | "canceled"
  | "refunded";

export const Status = {
  WAITING_FOR_ACCEPTANCE: "waiting_for_acceptance" as const,
  ACCEPTED: "accepted" as const,
  PREPARING: "preparing" as const,
  READY_FOR_PICKUP: "ready_for_pickup" as const,
  READY_FOR_DELIVERY: "ready_for_delivery" as const,
  PICKUP_SUCCESS: "pickup_success" as const,
  DELIVERY_IN_PROGRESS: "delivery_in_progress" as const,
  DELIVERED: "delivered" as const,
  CANCELED: "canceled" as const,
  REFUNDED: "refunded" as const,
} as const;

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  Status.WAITING_FOR_ACCEPTANCE,
  Status.ACCEPTED,
  Status.PREPARING,
  Status.READY_FOR_PICKUP,
  Status.READY_FOR_DELIVERY,
  Status.DELIVERY_IN_PROGRESS,
];

export const COMPLETED_ORDER_STATUSES: OrderStatus[] = [
  Status.PICKUP_SUCCESS,
  Status.DELIVERED,
  Status.CANCELED,
  Status.REFUNDED,
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  waiting_for_acceptance: "Waiting for Acceptance",
  accepted: "Order Accepted",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  ready_for_delivery: "Ready for Delivery",
  pickup_success: "Picked Up",
  delivery_in_progress: "Delivery In Progress",
  delivered: "Delivered",
  canceled: "Canceled",
  refunded: "Refunded",
};

export type OrderType = "pickup" | "delivery";

// Valid next statuses for pickup flow
const PICKUP_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  waiting_for_acceptance: "accepted",
  accepted: "preparing",
  preparing: "ready_for_pickup",
  ready_for_pickup: "pickup_success",
};

// Valid next statuses for delivery flow
const DELIVERY_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  waiting_for_acceptance: "accepted",
  accepted: "preparing",
  preparing: "ready_for_delivery",
  ready_for_delivery: "delivery_in_progress",
  delivery_in_progress: "delivered",
};

export function getNextStatus(currentStatus: OrderStatus, orderType: OrderType): OrderStatus | null {
  const transitions = orderType === "pickup" ? PICKUP_TRANSITIONS : DELIVERY_TRANSITIONS;
  return transitions[currentStatus] || null;
}

export function canCancel(status: OrderStatus): boolean {
  return status === "waiting_for_acceptance";
}

export function canRefund(status: OrderStatus): boolean {
  return !["canceled", "refunded"].includes(status);
}

export function getTimeUntilPickup(
  confirmedAt: string | null | undefined,
  pickupIn: number | null | undefined
): Date | undefined {
  if (!pickupIn || !confirmedAt) {
    return undefined;
  }
  const t0 = parseJSON(confirmedAt);
  return addMinutes(t0, pickupIn);
}
