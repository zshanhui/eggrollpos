import React, { useEffect, useState, useCallback } from 'react';
import { Status, STATUS_LABELS, getNextStatus, canCancel, canRefund } from '../../../shared/orders';
import type { OrderStatus, OrderType } from '../../../shared/orders';
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
  const [merchant, setMerchant] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (!merchantUuid) {
      setError('No merchant UUID provided');
      return;
    }
    fetchApi(`/api/merchants/by-uuid/${merchantUuid}`)
      .then(data => {
        if (data && data.id) {
          setMerchant(data);
        } else {
          setError('Merchant not found');
        }
      })
      .catch(() => setError('Failed to load merchant'));
  }, [merchantUuid]);

  if (error) {
    return (
      <div className="Merchant" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#FF1744' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{error}</div>
          <div style={{ color: '#888' }}>Check the merchant UUID in the URL</div>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="Merchant" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#666', fontSize: '1.5rem' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="Merchant">
      {selectedOrderId === null ? (
        <OrdersListPage
          merchantId={merchant.id}
          merchantName={merchant.business_name}
          merchantUuid={merchantUuid}
          onSelectOrder={setSelectedOrderId}
        />
      ) : (
        <OrderDetailPage
          merchantId={merchant.id}
          orderId={selectedOrderId}
          onBack={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}

// ─── Orders List (Grid) ───

function OrdersListPage({ merchantId, merchantName, merchantUuid, onSelectOrder }: { merchantId: number; merchantName: string; merchantUuid: string; onSelectOrder: (id: number) => void }) {
  const [orders, setOrders] = useState<any>(null);

  useEffect(() => {
    fetchApi(`/api/merchants/${merchantId}/orders`).then(setOrders);
  }, [merchantId]);

  const orderList = orders ? Object.values(orders) as any[] : [];

  return (
    <div className="OrdersGrid OrdersGrid--with-header">
      <div className="OrdersGrid__header">
        <h1 className="OrdersGrid__title">{merchantName}</h1>
        <div className="OrdersGrid__nav">
          <a href={`/merchant/${merchantUuid}/menuitems`}>Menu</a>
          <span className="OrdersGrid__count">{orderList.length}</span>
        </div>
      </div>
      <div className="OrdersGrid__cards">
        {orderList.length === 0 && orders !== null ? (
          <div className="OrdersGrid__empty">No orders yet</div>
        ) : (
          orderList.slice(0, 12).map((order: any) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onClick={() => onSelectOrder(order.orderId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Order Card (memoized for scroll perf on low-end devices) ───

const OrderCard = React.memo(function OrderCard({ order, onClick }: { order: any; onClick: () => void }) {
  const status: OrderStatus = order.status;
  const elapsed = getElapsed(order.createdAt);

  return (
    <div className={`OrderCard OrderCard--${status}`} onClick={onClick}>
      <div className="OrderCard__top">
        <span className="OrderCard__orderNum">#{order.orderId}</span>
        <span className="OrderCard__time">{elapsed}</span>
      </div>
      <div className="OrderCard__customer">{order.customerName}</div>
      <div className="OrderCard__items">
        {order.lineItems?.slice(0, 4).map((item: any, i: number) => (
          <div className="OrderCard__item" key={i}>
            <span className="OrderCard__item-qty">{item.quantity}×</span>
            <span>{item.name}</span>
          </div>
        ))}
        {order.lineItems?.length > 4 && (
          <div className="OrderCard__item" style={{ color: '#666' }}>
            +{order.lineItems.length - 4} more...
          </div>
        )}
      </div>
      <div className="OrderCard__bottom">
        <span className={`OrderTypeTag OrderTypeTag--${order.orderType || 'pickup'}`}>
          {order.orderType === 'delivery' ? '🚗 Delivery' : '🏪 Pickup'}
        </span>
        <span className={`StatusBadge StatusBadge--${status}`}>
          {STATUS_LABELS[status] || status}
        </span>
      </div>
    </div>
  );
});

// ─── Order Detail Page ───

function OrderDetailPage({ merchantId, orderId, onBack }: { merchantId: number; orderId: number; onBack: () => void }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reasonModal, setReasonModal] = useState<'cancel' | 'refund' | null>(null);

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

  const handleCancelOrRefund = useCallback(async (reason: string) => {
    if (!order || loading) return;
    const status = reasonModal === 'cancel' ? Status.CANCELED : Status.REFUNDED;
    setLoading(true);
    await postApi(`/api/merchants/${merchantId}/orders`, {
      orderId: order.id,
      status,
      cancelReason: reason,
    });
    setReasonModal(null);
    loadOrder();
    setLoading(false);
  }, [order, loading, merchantId, reasonModal, loadOrder]);

  if (!order) {
    return (
      <div className="OrderDetail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#666' }}>
        Loading...
      </div>
    );
  }

  const status: OrderStatus = order.status;
  const orderType: OrderType = order.orderType || 'pickup';
  const nextStatus = getNextStatus(status, orderType);
  const nextLabel = nextStatus ? STATUS_LABELS[nextStatus] : null;

  const totalCents = order.lineItems?.reduce((sum: number, li: any) => {
    return sum + (parseInt(li.priceCents) * li.quantity);
  }, 0) || 0;

  return (
    <div className="OrderDetail">
      <button className="OrderDetail__back" onClick={onBack}>
        ← Back to Orders
      </button>

      <div className="OrderDetail__header">
        <span className="OrderDetail__orderNum">Order #{order.id}</span>
        <div className="OrderDetail__status">
          <span className={`OrderTypeTag OrderTypeTag--${orderType}`}>
            {orderType === 'delivery' ? '🚗 Delivery' : '🏪 Pickup'}
          </span>
          <span className={`StatusBadge StatusBadge--${status}`}>
            {STATUS_LABELS[status] || status}
          </span>
        </div>
      </div>

      <div className="OrderDetail__meta">
        <div className="OrderDetail__meta-item">
          <span className="OrderDetail__meta-label">Customer</span>
          <span className="OrderDetail__meta-value">{order.customerName}</span>
        </div>
        <div className="OrderDetail__meta-item">
          <span className="OrderDetail__meta-label">Phone</span>
          <span className="OrderDetail__meta-value">{order.mobilePhone || 'N/A'}</span>
        </div>
        <div className="OrderDetail__meta-item">
          <span className="OrderDetail__meta-label">Created</span>
          <span className="OrderDetail__meta-value">{new Date(order.createdAt).toLocaleTimeString()}</span>
        </div>
        <div className="OrderDetail__meta-item">
          <span className="OrderDetail__meta-label">Pickup In</span>
          <span className="OrderDetail__meta-value">{order.pickupIn ? `${order.pickupIn} min` : 'N/A'}</span>
        </div>
      </div>

      <div className="OrderDetail__items">
        <h3>Order Items</h3>
        <table className="OrderDetail__items-table">
          <thead>
            <tr>
              <th>Qty</th>
              <th>Item</th>
              <th style={{ textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {order.lineItems?.map((li: any, i: number) => (
              <tr key={i}>
                <td className="item-qty">{li.quantity}</td>
                <td>
                  <div className="item-name">{li.name}</div>
                  {li.comments && <div className="item-comment">{li.comments}</div>}
                </td>
                <td className="item-price">${((parseInt(li.priceCents) * li.quantity) / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', marginTop: 16, fontSize: '1.3rem', fontWeight: 700, color: '#69F0AE' }}>
          Total: ${(totalCents / 100).toFixed(2)}
        </div>
      </div>

      {order.cancelReason && (
        <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 32, borderLeft: '4px solid #FF1744' }}>
          <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>
            {status === 'refunded' ? 'Refund Reason' : 'Cancel Reason'}
          </div>
          <div style={{ color: '#fff', fontSize: '1.1rem' }}>{order.cancelReason}</div>
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
            onClick={() => setReasonModal('cancel')}
            disabled={loading}
          >
            Cancel Order
          </button>
        )}
        {canRefund(status) && (
          <button
            className="OrderDetail__action-btn OrderDetail__action-btn--refund"
            onClick={() => setReasonModal('refund')}
            disabled={loading}
          >
            Refund
          </button>
        )}
      </div>

      {reasonModal && (
        <ReasonModal
          type={reasonModal}
          onSubmit={handleCancelOrRefund}
          onClose={() => setReasonModal(null)}
        />
      )}
    </div>
  );
}

// ─── Reason Modal ───

function ReasonModal({ type, onSubmit, onClose }: {
  type: 'cancel' | 'refund';
  onSubmit: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="ReasonModal__overlay" onClick={onClose}>
      <div className="ReasonModal" onClick={e => e.stopPropagation()}>
        <h3>{type === 'cancel' ? '❌ Cancel Order' : '💰 Refund Order'}</h3>
        <textarea
          className="ReasonModal__textarea"
          placeholder={`Enter ${type} reason...`}
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="ReasonModal__buttons">
          <button
            className="OrderDetail__action-btn"
            style={{ background: '#333', color: '#fff', padding: '12px 24px', fontSize: '1rem' }}
            onClick={onClose}
          >
            Go Back
          </button>
          <button
            className={`OrderDetail__action-btn OrderDetail__action-btn--${type === 'cancel' ? 'cancel' : 'refund'}`}
            style={{ padding: '12px 24px', fontSize: '1rem' }}
            onClick={() => reason.trim() && onSubmit(reason.trim())}
            disabled={!reason.trim()}
          >
            Confirm {type === 'cancel' ? 'Cancel' : 'Refund'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───

function getElapsed(createdAt: string): string {
  if (!createdAt) return '';
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}
