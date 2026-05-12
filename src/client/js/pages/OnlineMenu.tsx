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
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 bg-stone-50 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-full bg-stone-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-36 bg-stone-200 rounded animate-pulse" />
          <div className="h-4 w-56 bg-stone-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-5 w-32 bg-stone-200 rounded animate-pulse mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 p-4 bg-white rounded-2xl shadow-sm">
          <div className="w-20 h-20 bg-stone-200 rounded-xl animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-28 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotFound({ t }: { t: (key: string) => string }) {
  return (
    <div className="max-w-lg mx-auto min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center p-8">
        <div className="text-5xl mb-4">🍽️</div>
        <h1 className="text-xl font-bold text-stone-700 mb-2">{t('menus.notFound')}</h1>
        <p className="text-stone-500">{t('menus.notFoundDesc')}</p>
      </div>
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
    <div className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex items-start gap-3">
      <span className="text-lg flex-shrink-0">🕐</span>
      <div>
        <p className="font-semibold">{t('menus.currentlyClosed')}</p>
        <p className="text-amber-700 mt-0.5">{hoursText}</p>
      </div>
    </div>
  );
}

function Empty({ t }: { t: (key: string) => string }) {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl mb-3">📋</div>
      <p className="text-stone-400 font-medium">{t('menus.noItems')}</p>
    </div>
  );
}

const TYPE_ICONS: Record<string, string> = {
  cafe: '☕',
  restaurant: '🍜',
  fast_casual: '🌯',
  bakery: '🥖',
  bar: '🍸',
};

const CATEGORY_COLORS = [
  'border-l-amber-400',
  'border-l-emerald-400',
  'border-l-rose-400',
  'border-l-sky-400',
  'border-l-purple-400',
  'border-l-orange-400',
];

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
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-stone-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-stone-100 px-4 py-4 safe-top shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
            {TYPE_ICONS[merchant.type] || '🏪'}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-stone-900 truncate">{merchant.business_name}</h1>
            <p className="text-xs text-stone-400 truncate">
              {[merchant.address_street, merchant.address_city].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1" style={{ paddingLeft: '60px' }}>
          <span className="text-xs bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full capitalize font-medium">
            {merchant.type.replace(/_/g, ' ')}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${currently_open ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {currently_open ? '● ' + t('menus.open') : '● ' + t('menus.closed')}
          </span>
        </div>
      </header>

      {/* Menu title */}
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-xl font-bold text-stone-800">{menu.name}</h2>
        {menu.description && (
          <p className="text-sm text-stone-400 mt-1">{menu.description}</p>
        )}
      </div>

      {/* Closed banner */}
      {!currently_open && <ClosedBanner hours={business_hours} t={t} />}

      {/* Items */}
      <main className="flex-1 px-4 pb-28">
        {categories.length === 0 && uncategorized.length === 0 && <Empty t={t} />}

        {categories.map((cat, catIdx) => (
          <section key={cat.id} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">{cat.name}</h3>
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-300 font-medium">{cat.items.length}</span>
            </div>
            <div className="space-y-3">
              {cat.items.map((item, i) => (
                <ItemCard key={item.id} item={item} accent={CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length]} index={i} />
              ))}
            </div>
          </section>
        ))}

        {uncategorized.length > 0 && (
          <section className="mb-6">
            <div className="space-y-3">
              {uncategorized.map((item, i) => (
                <ItemCard key={item.id} item={item} accent="border-l-stone-300" index={i} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky footer */}
      <footer className="sticky bottom-0 z-10 px-4 py-4 safe-bottom bg-gradient-to-t from-stone-50 via-stone-50 to-transparent">
        <button
          onClick={() => props.history.push(`/online-ordering/${slug}/checkout`)}
          className="w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl text-base transition-all shadow-lg shadow-stone-900/10"
        >
          {t('menus.proceedToCheckout')}
        </button>
      </footer>
    </div>
  );
}

function ItemCard({ item, accent, index }: { item: MenuItem; accent: string; index: number }) {
  return (
    <div className={`flex items-start gap-3 p-4 bg-white rounded-2xl border-l-[3px] ${accent} shadow-sm hover:shadow-md transition-shadow`}>
      {/* Image */}
      <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center">
            <span className="text-stone-300 text-2xl select-none">
              {['🥘', '🥗', '🍜', '🍰', '☕', '🥩', '🍔', '🌮', '🥐', '🍱'][index % 10]}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <p className="font-semibold text-stone-800 text-[15px] leading-snug">{item.name}</p>
          <p className="font-bold text-amber-700 text-[15px] flex-shrink-0">{formatPrice(item.price_cents)}</p>
        </div>
        {item.description && (
          <p className="text-[13px] text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
        {item.modifiers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.modifiers.map((mod) => (
              <span key={mod.id} className="text-[11px] bg-stone-50 border border-stone-200 text-stone-500 px-2 py-0.5 rounded-lg font-medium">
                +{mod.name}
                {mod.price_adjustment_cents > 0 && (
                  <span className="text-amber-600 ml-0.5">{formatPrice(mod.price_adjustment_cents)}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
