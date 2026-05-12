import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  category_id: number | null;
  category_name: string | null;
  modifiers: { id: number; name: string; price_adjustment_cents: number }[];
}

interface Category {
  id: number;
  name: string;
  items: MenuItem[];
}

interface Menu {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  currently_open: boolean;
  business_hours: Record<string, { open: string | null; close: string | null }> | null;
  merchant: {
    id: number;
    business_name: string;
    address_street: string;
    address_city: string;
    address_state: string;
    address_postal_code: string;
    type: string;
  };
  categories: Category[];
  uncategorized: MenuItem[];
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function weekdayLabel(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function Skeleton() {
  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="h-24 bg-gray-200 rounded animate-pulse" />
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

function NotFound({ t }: { t: (key: string) => string }) {
  return (
    <div className="max-w-lg mx-auto p-8 text-center">
      <h1 className="text-xl font-semibold text-gray-700 mb-2">{t('menus.notFound')}</h1>
      <p className="text-gray-500">{t('menus.notFoundDesc')}</p>
    </div>
  );
}

function ClosedBanner({ hours, t }: { hours: Record<string, { open: string | null; close: string | null }> | null; t: (key: string) => string }) {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayNames = days.map(weekdayLabel);

  if (!hours) return null;

  const hoursText = days
    .reduce((acc, day, i) => {
      const h = hours[day];
      if (!h || h.open === null || h.close === null) return acc;
      const last = acc[acc.length - 1];
      const range = `${h.open}–${h.close}`;
      if (last && last.range === range) {
        last.end = dayNames[i];
        return acc;
      }
      acc.push({ start: dayNames[i], end: dayNames[i], range });
      return acc;
    }, [] as { start: string; end: string; range: string }[])
    .map((g) => (g.start === g.end ? `${g.start} ${g.range}` : `${g.start}–${g.end} ${g.range}`))
    .join(', ');

  return (
    <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
      <p className="font-medium">{t('menus.currentlyClosed')}</p>
      <p>{t('menus.hours')}: {hoursText}</p>
    </div>
  );
}

function Empty({ t }: { t: (key: string) => string }) {
  return (
    <div className="py-12 text-center text-gray-400">
      {t('menus.noItems')}
    </div>
  );
}

export default function OnlineMenu(props: any) {
  const { t } = useTranslation();
  const slug = props.match?.params?.slug;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/menus/${slug}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setMenu(data.menu);
      })
      .catch(() => setError(t('menus.loadFailed')))
      .finally(() => setLoading(false));
  }, [slug, t]);

  if (loading) return <Skeleton />;
  if (error || !menu) return <NotFound t={t} />;

  const { merchant, categories, uncategorized, currently_open, business_hours } = menu;

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-white">
      {/* Sticky header — merchant info */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 safe-top">
        <h1 className="text-lg font-bold text-gray-900">{merchant.business_name}</h1>
        <p className="text-sm text-gray-500">
          {[merchant.address_street, merchant.address_city, merchant.address_state, merchant.address_postal_code]
            .filter(Boolean)
            .join(', ')}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
            {merchant.type.replace(/_/g, ' ')}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${currently_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {currently_open ? t('menus.open') : t('menus.closed')}
          </span>
        </div>
      </header>

      {/* Menu title */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-base font-semibold text-gray-800">{menu.name}</h2>
        {menu.description && <p className="text-sm text-gray-400 mt-0.5">{menu.description}</p>}
      </div>

      {/* Closed banner */}
      {!currently_open && <ClosedBanner hours={business_hours} t={t} />}

      {/* Items by category */}
      <main className="flex-1 px-4 pb-24">
        {categories.length === 0 && uncategorized.length === 0 && <Empty t={t} />}

        {categories.map((cat) => (
          <section key={cat.id} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat.name}</h3>
            <div className="space-y-2">
              {cat.items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}

        {uncategorized.length > 0 && (
          <section className="mb-6">
            <div className="space-y-2">
              {uncategorized.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky footer — checkout button */}
      <footer className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-4 py-4 safe-bottom">
        <button
          onClick={() => props.history.push(`/online-ordering/${slug}/checkout`)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-base transition-colors"
        >
          {t('menus.proceedToCheckout')}
        </button>
      </footer>
    </div>
  );
}

function ItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-xl">+</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <p className="font-medium text-gray-900 text-base truncate">{item.name}</p>
          <p className="font-semibold text-gray-900 text-base flex-shrink-0">{formatPrice(item.price_cents)}</p>
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        {item.modifiers.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.modifiers.map((mod) => (
              <span key={mod.id} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {mod.name} {mod.price_adjustment_cents > 0 ? `(+${formatPrice(mod.price_adjustment_cents)})` : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
