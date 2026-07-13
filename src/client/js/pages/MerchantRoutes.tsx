import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Status, STATUS_LABELS, getNextStatus, canCancel } from '../../../shared/orders';
import type { OrderStatus, OrderType } from '../../../shared/orders';
import { resolveMerchantTheme } from '../../../shared/merchants';
import { merchantDashboardPath, merchantKitchenTicketPath } from '../../../shared/merchant_dashboard';
import type { OrderStreamPayload } from '../../../shared/order_events';
import { useMerchantHashRoute } from '../hooks/useMerchantHashRoute';
import { useMerchantOrderStream, useElapsedTick, type ConnectionStatus } from '../hooks/useMerchantOrderStream';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { fetchApi, postApi } from '../lib/merchantApi';
import '../../css/pages/MerchantRoutes.css';

// ─── Main Container ───

export default function MerchantRoutes(props: any) {
  const hashId = props.match?.params?.hashId;
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { t } = useTranslation();
  const { merchant, error, merchantHashId } = useMerchantHashRoute(hashId, t);

  if (error) {
    return (
      <div className="Merchant Merchant__centered">
        <div className="Merchant__error">
          <div className="Merchant__error-title">{error}</div>
          <div className="Merchant__error-hint">{t('merchant.checkHashId')}</div>
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

  const theme = resolveMerchantTheme(merchant.theme);
  return (
    <div className={`Merchant Merchant--theme-${theme}`}>
      {selectedOrderId === null ? (
        <OrdersListPage
          merchantId={merchant.id}
          merchantName={merchant.business_name}
          merchantHashId={merchantHashId}
          onSelectOrder={setSelectedOrderId}
          t={t}
        />
      ) : (
        <OrderDetailPage
          merchantId={merchant.id}
          merchantHashId={merchantHashId}
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

const KDS_FULL_ORDER_LIMIT = 10;

function sortFifo(a: any, b: any) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

function splitActiveBoard(awaitingPreparing: any[], ready: any[], limit = KDS_FULL_ORDER_LIMIT) {
  const globalFifo = [...awaitingPreparing, ...ready].sort(sortFifo);
  const hasOverflow = globalFifo.length > limit;
  const visibleFullLimit = hasOverflow ? Math.max(limit - 1, 0) : limit;
  const fullIds = new Set(globalFifo.slice(0, visibleFullLimit).map((order) => order.orderId));
  const pileFrontOrder = hasOverflow ? globalFifo[visibleFullLimit] : null;
  const hiddenPileOrders = hasOverflow ? globalFifo.slice(visibleFullLimit + 1) : [];
  const activeFull = awaitingPreparing.filter((order) => fullIds.has(order.orderId));
  const readyFull = ready.filter((order) => fullIds.has(order.orderId));
  const showDivider = activeFull.length > 0 && ready.length > 0;

  return { activeFull, readyFull, pileFrontOrder, hiddenPileOrders, showDivider };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function OrdersListPage({ merchantId, merchantName, merchantHashId, onSelectOrder, t }: { merchantId: number; merchantName: string; merchantHashId: string; onSelectOrder: (id: number) => void; t: (key: string) => string }) {
  const [orders, setOrders] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(() => new Set());
  const highlightTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const { signOut } = useMerchantAuth();
  const isMobile = useIsMobile();
  const elapsedTick = useElapsedTick();

  const loadOrders = useCallback(() => {
    const params = new URLSearchParams();
    params.set('date', todayISO());
    return fetchApi(`/api/merchants/${merchantId}/orders?${params}`).then(setOrders);
  }, [merchantId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const highlightOrder = useCallback((orderId: number) => {
    setHighlightedIds((prev) => new Set(prev).add(orderId));
    const existing = highlightTimers.current.get(orderId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      highlightTimers.current.delete(orderId);
    }, 5000);
    highlightTimers.current.set(orderId, timer);
  }, []);

  useEffect(() => () => {
    highlightTimers.current.forEach((timer) => clearTimeout(timer));
  }, []);

  const handleStreamEvent = useCallback((event: OrderStreamPayload) => {
    if (event.type === 'order_created') {
      highlightOrder(event.orderId);
    }
    loadOrders();
  }, [highlightOrder, loadOrders]);

  const { connectionStatus } = useMerchantOrderStream(merchantId, handleStreamEvent);

  const orderList = orders ? Object.values(orders) as any[] : [];

  const { awaitingPreparing, ready, canceledRefunded } = useMemo(() => {
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
    };
  }, [orderList]);

  const activeBoard = useMemo(
    () => splitActiveBoard(awaitingPreparing, ready),
    [awaitingPreparing, ready],
  );

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'active') return [...awaitingPreparing, ...ready];
    return canceledRefunded;
  }, [statusFilter, awaitingPreparing, ready, canceledRefunded]);

  const renderOrderCard = (order: any) => (
    <OrderCard
      key={order.orderId}
      order={order}
      highlighted={highlightedIds.has(order.orderId)}
      elapsedTick={elapsedTick}
      onClick={() => onSelectOrder(order.orderId)}
      t={t}
    />
  );

  return (
    <div className="OrdersGrid OrdersGrid--with-header">
      <div className="OrdersGrid__header">
        <h1 className="OrdersGrid__title">{merchantName}</h1>
        <div className="OrdersGrid__nav">
          <a href={merchantDashboardPath(merchantHashId, 'online-menus')}>{t('merchant.menus')}</a>
          <a href={merchantDashboardPath(merchantHashId, 'menuitems')}>{t('merchant.menu')}</a>
          <a href={merchantDashboardPath(merchantHashId, 'settings')}>{t('merchant.settings')}</a>
          <button type="button" className="OrdersGrid__nav-button" onClick={signOut}>Sign out</button>
          <ConnectionIndicator status={connectionStatus} t={t} />
          <span className="OrdersGrid__count">{filteredOrders.length}</span>
        </div>
      </div>
      <div className="OrdersGrid__filters">
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
            {activeBoard.activeFull.map(renderOrderCard)}
            {activeBoard.showDivider && (
              <div className="OrdersGrid__divider" role="separator" aria-label={t('merchant.kdsReadyDivider')}>
                <span className="OrdersGrid__divider-label">{t('merchant.kdsReadyDivider')}</span>
              </div>
            )}
            {activeBoard.readyFull.map(renderOrderCard)}
            {activeBoard.pileFrontOrder && activeBoard.hiddenPileOrders.length > 0 && (
              <OrderPile
                frontOrder={activeBoard.pileFrontOrder}
                waitingCount={activeBoard.hiddenPileOrders.length}
                highlightedIds={highlightedIds}
                elapsedTick={elapsedTick}
                onSelectOrder={onSelectOrder}
                t={t}
              />
            )}
          </>
        ) : (
          <div className="OrdersGrid__section OrdersGrid__section--canceled">
            {canceledRefunded.map((order: any) => (
              <OrderCard
                key={order.orderId}
                order={order}
                highlighted={highlightedIds.has(order.orderId)}
                elapsedTick={elapsedTick}
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

// ─── Order pile (overflow beyond first 10 FIFO) ───

const OrderPile = React.memo(function OrderPile({
  frontOrder,
  waitingCount,
  highlightedIds,
  elapsedTick,
  onSelectOrder,
  t,
}: {
  frontOrder: any;
  waitingCount: number;
  highlightedIds: Set<number>;
  elapsedTick?: number;
  onSelectOrder: (id: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const stackLayers = Math.min(waitingCount, 3);

  const handleActivate = () => onSelectOrder(frontOrder.orderId);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  return (
    <div
      className="OrderPile"
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={t('merchant.kdsOrderPile', { count: waitingCount })}
    >
      <div className="OrderPile__stack">
        {Array.from({ length: stackLayers }).map((_, index) => (
          <div
            key={`layer-${index}`}
            className="OrderPile__layer OrderPile__layer--back"
            style={{ ['--pile-layer' as string]: index + 1 }}
            aria-hidden="true"
          />
        ))}
        <div className="OrderPile__layer OrderPile__layer--front">
          <OrderCard
            order={frontOrder}
            highlighted={highlightedIds.has(frontOrder.orderId)}
            elapsedTick={elapsedTick}
            onClick={() => onSelectOrder(frontOrder.orderId)}
            t={t}
            inPile
          />
        </div>
      </div>
      <div className="OrderPile__label">{t('merchant.kdsOrderPile', { count: waitingCount })}</div>
    </div>
  );
});

// ─── Order Card (memoized for scroll perf on low-end devices) ───

const OrderCard = React.memo(function OrderCard({ order, highlighted, elapsedTick, onClick, t, inPile }: { order: any; highlighted?: boolean; elapsedTick?: number; onClick?: () => void; t: (key: string) => string; inPile?: boolean }) {
  const status: OrderStatus = order.status;
  const elapsed = getElapsed(order.createdAt, t, elapsedTick);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onClick || inPile) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`OrderCard OrderCard--${status}${highlighted ? ' OrderCard--highlight' : ''}${inPile ? ' OrderCard--in-pile' : ''}`}
      onClick={inPile ? undefined : onClick}
      onKeyDown={inPile ? undefined : handleKeyDown}
      role={inPile ? undefined : 'button'}
      tabIndex={inPile ? -1 : 0}
      aria-label={`View order #${order.displayNumber ?? order.orderId} from ${order.customerName}`}
    >
      <div className="OrderCard__top">
        <span className="OrderCard__orderNum">#{order.displayNumber ?? order.orderId}</span>
        <span className="OrderCard__time">{elapsed}</span>
      </div>
      <div className="OrderCard__items">
        {order.lineItems?.map((item: any, i: number) => (
          <div className="OrderCard__item" key={i}>
            <span className="OrderCard__item-qty">{item.quantity}×</span>
            <span>{item.name}</span>
          </div>
        ))}
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

function OrderDetailPage({ merchantId, merchantHashId, orderId, onBack, t }: { merchantId: number; merchantHashId: string; orderId: number; onBack: () => void; t: (key: string) => string }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reasonModal, setReasonModal] = useState<boolean>(false);

  const loadOrder = useCallback(() => {
    fetchApi(`/api/merchants/${merchantId}/orders/${orderId}`).then(setOrder);
  }, [merchantId, orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  const handleStreamEvent = useCallback((event: OrderStreamPayload) => {
    if (event.orderId === orderId) {
      loadOrder();
    }
  }, [orderId, loadOrder]);

  const { connectionStatus } = useMerchantOrderStream(merchantId, handleStreamEvent);

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
      <div className="OrderDetail">
        <div className="OrderDetail__toolbar">
          <button type="button" className="OrderDetail__back" onClick={onBack}>
            {t('merchant.backToOrders')}
          </button>
        </div>
        <div className="OrderDetail__loading">{t('common.loading')}</div>
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
      <div className="OrderDetail__toolbar">
        <button type="button" className="OrderDetail__back" onClick={onBack}>
          {t('merchant.backToOrders')}
        </button>
        <ConnectionIndicator status={connectionStatus} t={t} />
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
        <a
          className="OrderDetail__action-btn OrderDetail__action-btn--secondary"
          href={merchantKitchenTicketPath(merchantHashId, order.uuid, true)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('kitchenTicket.print')}
        </a>
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

function ConnectionIndicator({ status, t }: { status: ConnectionStatus; t: (key: string) => string }) {
  const label = status === 'live'
    ? t('merchant.live')
    : status === 'connecting'
      ? t('merchant.connecting')
      : t('merchant.reconnecting');

  return (
    <span className={`ConnectionIndicator ConnectionIndicator--${status}`} title={label}>
      <span className="ConnectionIndicator__dot" aria-hidden="true" />
      <span className="ConnectionIndicator__label">{label}</span>
    </span>
  );
}

function getElapsed(createdAt: string, t: (key: string) => string, _tick?: number): string {
  if (!createdAt) return '';
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('time.justNow');
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}
