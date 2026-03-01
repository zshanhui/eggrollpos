
export type PaymentMethod =
  | "in_store"
  | "online_card";

export const PaymentMethods = {
  IN_STORE: "in_store" as const,
  ONLINE_CARD: "online_card" as const,
} as const;
