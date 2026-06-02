import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  loadCart,
  clearCart,
  cartSubtotalCents,
  cartItemCount,
  type OnlineCart,
} from '../lib/onlineCart';
import { submitMenuCheckout, type MockPaymentMethod } from '../api/checkout';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const TAX_RATE = 0.07;

export default function Checkout(props: any) {
  const { t } = useTranslation();
  const slug = props.match?.params?.slug as string;
  const history = props.history;

  const [cart, setCart] = useState<OnlineCart | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [comments, setComments] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<MockPaymentMethod>('mock_pay_at_pickup');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = loadCart(slug);
    setCart(c);
    if (!c || c.lines.length === 0) {
      history.replace(`/online-ordering/${slug}`);
    }
  }, [slug, history]);

  const subtotal = useMemo(() => cartSubtotalCents(cart), [cart]);
  const tax = useMemo(() => Math.ceil(subtotal * TAX_RATE), [subtotal]);
  const total = subtotal + tax;
  const itemCount = cartItemCount(cart);

  if (!cart || cart.lines.length === 0) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitMenuCheckout(slug, {
        lineItems: cart.lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
        })),
        contact: {
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          whatsappOptIn: whatsappOptIn && Boolean(phone.trim()),
        },
        comments: comments.trim() || undefined,
        orderType: 'pickup',
        paymentMethod,
      });
      clearCart(slug);
      history.push(`/receipts/${result.receiptId}`);
    } catch (err: any) {
      setError(err?.message || t('checkout.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-white pb-8">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <button
          type="button"
          onClick={() => history.push(`/online-ordering/${slug}`)}
          className="text-sm text-blue-600 mb-1"
        >
          ← {t('checkout.backToMenu')}
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('checkout.title')}</h1>
        <p className="text-sm text-gray-500">{cart.merchantName}</p>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-4 pt-4 gap-6">
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t('checkout.orderSummary')} ({itemCount})
          </h2>
          <ul className="space-y-2">
            {cart.lines.map((line) => (
              <li key={line.menuItemId} className="flex justify-between text-sm">
                <span>
                  {line.quantity}× {line.name}
                </span>
                <span className="font-medium">{formatPrice(line.priceCents * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{t('checkout.subtotal')}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{t('checkout.tax')}</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900">
              <span>{t('checkout.total')}</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t('checkout.contact')}
          </h2>
          <p className="text-xs text-gray-500 mb-3">{t('checkout.contactHint')}</p>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-700">{t('checkout.name')}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-base"
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">{t('checkout.phone')}</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('checkout.phonePlaceholder')}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-base"
                autoComplete="tel"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">{t('checkout.email')}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('checkout.emailPlaceholder')}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-base"
                autoComplete="email"
              />
            </label>
            {phone.trim() && (
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">{t('checkout.whatsappOptIn')}</span>
              </label>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t('checkout.payment')}
          </h2>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            {t('checkout.mockPaymentNotice')}
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'mock_pay_at_pickup'}
                onChange={() => setPaymentMethod('mock_pay_at_pickup')}
              />
              <span className="text-sm">{t('checkout.payAtPickup')}</span>
            </label>
            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'mock_card'}
                onChange={() => setPaymentMethod('mock_card')}
              />
              <span className="text-sm">{t('checkout.mockCard')}</span>
            </label>
          </div>
        </section>

        <label className="block">
          <span className="text-sm text-gray-700">{t('checkout.comments')}</span>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-base"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl text-base"
        >
          {submitting ? t('checkout.placingOrder') : t('checkout.placeOrder')}
        </button>
      </form>
    </div>
  );
}
