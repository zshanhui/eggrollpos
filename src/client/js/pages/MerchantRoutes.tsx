import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Status, STATUS_LABELS, getNextStatus, canCancel } from '../../../shared/orders';
import type { OrderStatus, OrderType } from '../../../shared/orders';
import type { MerchantRow } from '../../../shared/merchants';
import LangSwitcher from '../components/LangSwitcher';
import '../../css/pages/MerchantRoutes.css';

function fetchApi(url: string) {
  return fetch(url, { credentials: 'same-origin' as const }).then(r => r.json());
}

function postApi(url: string, body: any) {
  return fetch(url, {
    method: 'POST',
    credentials: 'same-origin' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json());
}

// ─── Main Container ───

export default function MerchantRoutes(props: any) {
  const merchantUuid = props.match?.params?.uuid;
  const [merchant, setMerchant] = useState<MerchantRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    if (!merchantUuid) {
      setError(t('merchant.noUuid'));
      return;
    }
    fetchApi(`/api/merchants/${merchantUuid}`)
      .then(data => {
        if (data && data.id) {
          setMerchant(data);
        } else {
          setError(t('merchant.notFound'));
        }
      })
      .catch(() => setError(t('merchant.loadFailed')));
  }, [merchantUuid, t]);

  if (error) {
    return (
      <div className="Merchant Merchant__centered">
        <div className="Merchant__error">
          <div className="Merchant__error-title">{error}</div>
          <div className="Merchant__error-hint">{t('merchant.checkUuid')}</div>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="Merchant Merchant__centered Merchant__loading">
        {t('common.loading')}
      </div>
    );
  }

  const theme = merchant.theme === 'light' ? 'light' : 'dark';
  return (
    <div className={`Merchant Merchant--theme-${theme}`}>
      {selectedOrderId === null ? (
        <OrdersListPage
          merchantId={merchant.id}
          merchantName={merchant.business_name}
          merchantUuid={merchantUuid}
          onSelectOrder={setSelectedOrderId}
          t={t}
        />
      ) : (
        <OrderDetailPage
          merchantId={merchant.id}
          orderId={selectedOrderId}
          onBack={() => setSelectedOrderId(null)}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Orders List (Grid) ───

const MOBILE_BREAKPOINT = 600;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    handler();
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

const AWAITING_PREPARING_STATUSES: OrderStatus[] = [
  Status.WAITING_FOR_ACCEPTANCE,
  Status.ACCEPTED,
  Status.PREPARING,
];

const READY_STATUSES: OrderStatus[] = [
  Status.READY_FOR_PICKUP,
  Status.READY_FOR_DELIVERY,
  Status.DELIVERY_IN_PROGRESS,
  Status.PICKUP_SUCCESS,
  Status.DELIVERED,
];

type StatusFilter = 'active' | 'canceled_refunded';

const FILTER_OPTIONS: { key: StatusFilter; label: string; colorClass: string }[] = [
  { key: 'active', label: 'Active', colorClass: 'OrdersGrid__pill--active-color' },
  { key: 'canceled_refunded', label: 'Canceled/Refunded', colorClass: 'OrdersGrid__pill--canceled-color' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function OrdersListPage({ merchantId, merchantName, merchantUuid, onSelectOrder, t }: { merchantId: number; merchantName: string; merchantUuid: string; onSelectOrder: (id: number) => void; t: (key: string) => string }) {
  const [orders, setOrders] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [dateFilter, setDateFilter] = useState<string>(() => todayISO());
  const isMobile = useIsMobile();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('date', dateFilter);
    fetchApi(`/api/merchants/${merchantId}/orders?${params}`).then(setOrders);
  }, [merchantId, dateFilter]);

  const orderList = orders ? Object.values(orders) as any[] : [];

  const { awaitingPreparing, ready, canceledRefunded, orderCountToday } = useMemo(() => {
    const sortFifo = (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    const awaiting = orderList
      .filter((o: any) => AWAITING_PREPARING_STATUSES.includes(o.status))
      .sort(sortFifo);
    const readyList = orderList
      .filter((o: any) => READY_STATUSES.includes(o.status))
      .sort(sortFifo);
    const canceled = orderList.filter((o: any) => o.status === Status.CANCELED || o.status === Status.REFUNDED);
    return {
      awaitingPreparing: awaiting,
      ready: readyList,
      canceledRefunded: canceled,
      orderCountToday: orderList.length,
    };
  }, [orderList]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'active') return [...awaitingPreparing, ...ready];
    return canceledRefunded;
  }, [statusFilter, awaitingPreparing, ready, canceledRefunded]);

  const displayAwaiting = statusFilter === 'active' ? awaitingPreparing : [];
  const displayReady = statusFilter === 'active' ? ready : [];

  return (
    <div className="OrdersGrid OrdersGrid--with-header">
      <div className="OrdersGrid__header">
        <h1 className="OrdersGrid__title">{merchantName}<LangSwitcher /></h1>
        <div className="OrdersGrid__nav">
          <a href={`/merchant-dashboard/${merchantUuid}/menuitems`}>{t('merchant.menu')}</a>
          <a href={`/merchant-dashboard/${merchantUuid}/settings`}>{t('merchant.settings')}</a>
          <span className="OrdersGrid__count">{filteredOrders.length}</span>
        </div>
      </div>
      <div className="OrdersGrid__filters">
        <div className="OrdersGrid__date-row">
          <input
            type="date"
            className="OrdersGrid__date-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter orders by date"
          />
          <span className="OrdersGrid__order-count">
            {orderCountToday} order{orderCountToday !== 1 ? 's' : ''} today
          </span>
        </div>
        {isMobile ? (
          <select
            className="OrdersGrid__filter-dropdown"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter orders by status"
          >
            {FILTER_OPTIONS.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        ) : (
          FILTER_OPTIONS.map(({ key, label, colorClass }) => (
            <button
              key={key}
              className={`OrdersGrid__pill ${colorClass} ${statusFilter === key ? 'OrdersGrid__pill--active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </button>
          ))
        )}
      </div>
      <div className="OrdersGrid__cards">
        {filteredOrders.length === 0 && orders !== null ? (
          <div className="OrdersGrid__empty">
            {orderList.length === 0 ? t('merchant.noOrders') : t('merchant.noMatchingOrders')}
          </div>
        ) : statusFilter === 'active' ? (
          <>
            <div className="OrdersGrid__section OrdersGrid__section--awaiting">
              {displayAwaiting.slice(0, 15).map((order: any) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  onClick={() => onSelectOrder(order.orderId)}
                  t={t}
                />
              ))}
            </div>
            <div className="OrdersGrid__section OrdersGrid__section--ready">
              <div className="OrdersGrid__section-label">Ready</div>
              <div className="OrdersGrid__ready-scroll">
                {displayReady.map((order: any) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    onClick={() => onSelectOrder(order.orderId)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="OrdersGrid__section OrdersGrid__section--canceled">
            {canceledRefunded.map((order: any) => (
              <OrderCard
                key={order.orderId}
                order={order}
                onClick={() => onSelectOrder(order.orderId)}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Order Card (memoized for scroll perf on low-end devices) ───

const OrderCard = React.memo(function OrderCard({ order, onClick, t }: { order: any; onClick: () => void; t: (key: string) => string }) {
  const status: OrderStatus = order.status;
  const elapsed = getElapsed(order.createdAt, t);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`OrderCard OrderCard--${status}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View order #${order.displayNumber ?? order.orderId} from ${order.customerName}`}
    >
      <div className="OrderCard__top">
        <span className="OrderCard__orderNum">#{order.displayNumber ?? order.orderId}</span>
        <span className="OrderCard__time">{elapsed}</span>
      </div>
      <div className="OrderCard__items">
        {order.lineItems?.slice(0, 2).map((item: any, i: number) => (
          <div className="OrderCard__item" key={i}>
            <span className="OrderCard__item-qty">{item.quantity}×</span>
            <span>{item.name}</span>
          </div>
        ))}
        {order.lineItems?.length > 2 && (
          <div className="OrderCard__item OrderCard__item-more">
            +{order.lineItems.length - 2} {t('merchant.moreItems')}
          </div>
        )}
      </div>
      <div className="OrderCard__customer">{order.customerName}</div>
      <div className="OrderCard__bottom">
        <span className={`OrderTypeTag OrderTypeTag--${order.orderType || 'pickup'}`}>
          {order.orderType === 'delivery' ? t('orderType.delivery') : t('orderType.pickup')}
        </span>
        <span className={`StatusBadge StatusBadge--${status}`}>
          {t(`orderStatus.${status}`) || status}
        </span>
      </div>
    </div>
  );
});

// ─── Order Detail Page ───

function OrderDetailPage({ merchantId, orderId, onBack, t }: { merchantId: number; orderId: number; onBack: () => void; t: (key: string) => string }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reasonModal, setReasonModal] = useState<boolean>(false);

  const loadOrder = useCallback(() => {
    fetchApi(`/api/merchants/${merchantId}/orders/${orderId}`).then(setOrder);
  }, [merchantId, orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  const handleAdvance = useCallback(async () => {
    if (!order || loading) return;
    const next = getNextStatus(order.status, order.orderType || 'pickup');
    if (!next) return;
    setLoading(true);
    await postApi(`/api/merchants/${merchantId}/orders`, {
      orderId: order.id,
      status: next,
    });
    loadOrder();
    setLoading(false);
  }, [order, loading, merchantId, loadOrder]);

  const handleCancel = useCallback(async (reason: string) => {
    if (!order || loading) return;
    setLoading(true);
    await postApi(`/api/merchants/${merchantId}/orders`, {
      orderId: order.id,
      status: Status.REFUNDED,
      cancelReason: reason,
    });
    setReasonModal(false);
    loadOrder();
    setLoading(false);
  }, [order, loading, merchantId, loadOrder]);

  if (!order) {
    return (
      <div className="OrderDetail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#666' }}>
        {t('common.loading')}
      </div>
    );
  }

  const status: OrderStatus = order.status;
  const orderType: OrderType = order.orderType || 'pickup';
  const nextStatus = getNextStatus(status, orderType);
  const nextLabel = nextStatus
    ? (nextStatus === Status.ACCEPTED ? t('merchant.acceptOrder') : t(`orderStatus.${nextStatus}`))
    : null;

  const totalCents = order.lineItems?.reduce((sum: number, li: any) => {
    return sum + (parseInt(li.priceCents) * li.quantity);
  }, 0) || 0;

  return (
    <div className="OrderDetail">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="OrderDetail__back" onClick={onBack}>
          {t('merchant.backToOrders')}
        </button>
        <LangSwitcher />
      </div>

      <div className="OrderDetail__header">
        <span className="OrderDetail__orderNum">{t('merchant.orderNum', { id: order.displayNumber ?? order.id })}</span>
        <div className="OrderDetail__status">
          <span className={`OrderTypeTag OrderTypeTag--${orderType}`}>
            {orderType === 'delivery' ? t('orderType.delivery') : t('orderType.pickup')}
          </span>
          <span className={`StatusBadge StatusBadge--${status}`}>
            {t(`orderStatus.${status}`) || status}
          </span>
        </div>
      </div>

      <div className="OrderDetail__meta">
        <div className="OrderDetail__meta-item">
          <span className="OrderDetail__meta-label">{t('merchant.customer')}</span>
          <span className="OrderDetail__meta-value">{order.customerName}</span>
        </div>
        <div className="OrderDetail__meta-item">
          <span className="OrderDetail__meta-label">{t('merchant.phone')}</span>
          <span className="OrderDetail__meta-value">{order.mobilePhone || t('common.na')}</span>
        </div>
        <div className="OrderDetail__meta-item">
          <span className="OrderDetail__meta-label">{t('merchant.orderPlaced')}</span>
          <span className="OrderDetail__meta-value">{new Date(order.createdAt).toLocaleTimeString()}</span>
        </div>
        <div className="OrderDetail__meta-item">
          <span className="OrderDetail__meta-label">{t('merchant.pickupIn')}</span>
          <span className="OrderDetail__meta-value">{order.pickupIn ? `${order.pickupIn} min` : t('common.na')}</span>
        </div>
        {order.comments?.trim() && (
          <div className="OrderDetail__meta-comment">
            <span className="OrderDetail__meta-label">Note</span>
            <span className="OrderDetail__meta-comment-text">{order.comments}</span>
          </div>
        )}
      </div>

      <div className="OrderDetail__items">
        <table className="OrderDetail__items-table">
          <thead>
            <tr>
              <th>{t('common.qty')}</th>
              <th>{t('common.item')}</th>
              <th style={{ textAlign: 'right' }}>{t('common.price')}</th>
            </tr>
          </thead>
          <tbody>
            {order.lineItems?.map((li: any, i: number) => (
              <tr key={i}>
                <td className="item-qty">{li.quantity}</td>
                <td>
                  <div className="item-name">{li.name}</div>
                </td>
                <td className="item-price">${((parseInt(li.priceCents) * li.quantity) / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="OrderDetail__total">
          {t('common.total')}: ${(totalCents / 100).toFixed(2)}
        </div>
      </div>

      {order.cancelReason && (
        <div className="OrderDetail__cancel-reason">
          <div className="OrderDetail__cancel-reason-label">
            {status === 'refunded' ? t('merchant.refundReason') : t('merchant.cancelReason')}
          </div>
          <div className="OrderDetail__cancel-reason-text">{order.cancelReason}</div>
        </div>
      )}

      <div className="OrderDetail__actions">
        {nextLabel && (
          <button
            className="OrderDetail__action-btn OrderDetail__action-btn--primary"
            onClick={handleAdvance}
            disabled={loading}
          >
            → {nextLabel}
          </button>
        )}
        {canCancel(status) && (
          <button
            className="OrderDetail__action-btn OrderDetail__action-btn--cancel"
            onClick={() => setReasonModal(true)}
            disabled={loading}
          >
            {t('merchant.cancelOrder')}
          </button>
        )}
      </div>

      {reasonModal && (
        <ReasonModal
          onSubmit={handleCancel}
          onClose={() => setReasonModal(false)}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Reason Modal ───

function ReasonModal({ onSubmit, onClose, t }: {
  onSubmit: (reason: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="ReasonModal__overlay" onClick={onClose}>
      <div className="ReasonModal" onClick={e => e.stopPropagation()}>
        <h3>{t('merchant.cancelOrderTitle')}</h3>
        <textarea
          className="ReasonModal__textarea"
          placeholder={t('merchant.enterCancelReason')}
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="ReasonModal__buttons">
          <button
            className="OrderDetail__action-btn ReasonModal__btn-back"
            onClick={onClose}
          >
            {t('merchant.goBack')}
          </button>
          <button
            className="OrderDetail__action-btn OrderDetail__action-btn--cancel ReasonModal__btn-confirm"
            onClick={() => reason.trim() && onSubmit(reason.trim())}
            disabled={!reason.trim()}
          >
            {t('merchant.confirmCancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───

function getElapsed(createdAt: string, t: (key: string) => string): string {
  if (!createdAt) return '';
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('time.justNow');
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}
