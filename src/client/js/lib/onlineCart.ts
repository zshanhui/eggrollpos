export interface CartLine {
  menuItemId: number;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface OnlineCart {
  slug: string;
  merchantName: string;
  lines: CartLine[];
  updatedAt: number;
}

function storageKey(slug: string): string {
  return `eggroll_cart_${slug}`;
}

export function loadCart(slug: string): OnlineCart | null {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnlineCart;
    if (parsed.slug !== slug || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCart(cart: OnlineCart): void {
  cart.updatedAt = Date.now();
  localStorage.setItem(storageKey(cart.slug), JSON.stringify(cart));
}

export function clearCart(slug: string): void {
  localStorage.removeItem(storageKey(slug));
}

export function cartItemCount(cart: OnlineCart | null): number {
  if (!cart) return 0;
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function cartSubtotalCents(cart: OnlineCart | null): number {
  if (!cart) return 0;
  return cart.lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
}

export function addToCart(
  slug: string,
  merchantName: string,
  item: { id: number; name: string; price_cents: number },
  delta = 1
): OnlineCart {
  const existing = loadCart(slug);
  const cart: OnlineCart = existing ?? { slug, merchantName, lines: [], updatedAt: Date.now() };
  cart.merchantName = merchantName;

  const line = cart.lines.find((l) => l.menuItemId === item.id);
  if (line) {
    line.quantity = Math.min(10, Math.max(0, line.quantity + delta));
    if (line.quantity === 0) {
      cart.lines = cart.lines.filter((l) => l.menuItemId !== item.id);
    }
  } else if (delta > 0) {
    cart.lines.push({
      menuItemId: item.id,
      name: item.name,
      priceCents: item.price_cents,
      quantity: Math.min(10, delta),
    });
  }

  saveCart(cart);
  return cart;
}
