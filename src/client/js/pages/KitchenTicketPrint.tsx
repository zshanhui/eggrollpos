import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { KitchenTicket } from '../../../shared/kitchen_ticket';
import { merchantDashboardPath } from '../../../shared/merchant_dashboard';
import { useMerchantHashRoute } from '../hooks/useMerchantHashRoute';
import { fetchApi } from '../lib/merchantApi';
import '../../css/pages/KitchenTicketPrint.css';

function useQueryFlag(name: string): boolean {
  return React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get(name) === '1';
  }, [name]);
}

function KitchenTicketBody({ ticket, t }: { ticket: KitchenTicket; t: (key: string) => string }) {
  const orderTypeLabel =
    ticket.orderType === 'delivery' ? t('orderType.delivery') : t('orderType.pickup');

  return (
    <article className="KitchenTicketPrint__paper" aria-label={t('kitchenTicket.title')}>
      <h1 className="KitchenTicketPrint__merchant">{ticket.merchantName}</h1>
      <hr className="KitchenTicketPrint__rule" />
      <div className="KitchenTicketPrint__header-row">
        <span className="KitchenTicketPrint__order-num">
          {t('merchant.orderNum', { id: ticket.displayNumber })}
        </span>
        <span className="KitchenTicketPrint__order-type">{orderTypeLabel}</span>
      </div>
      <p className="KitchenTicketPrint__time">
        {new Date(ticket.createdAt).toLocaleString()}
      </p>
      <hr className="KitchenTicketPrint__rule" />
      <ul className="KitchenTicketPrint__items">
        {ticket.lineItems.map((item) => (
          <li className="KitchenTicketPrint__item" key={item.lineItemId}>
            <div className="KitchenTicketPrint__item-line">
              <span className="KitchenTicketPrint__item-qty">{item.quantity}×</span>
              <span>{item.name}</span>
            </div>
            {item.modifiers.length > 0 && (
              <ul className="KitchenTicketPrint__modifiers">
                {item.modifiers.map((mod, i) => (
                  <li className="KitchenTicketPrint__modifier" key={`${item.lineItemId}-${i}`}>
                    {mod.name}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {ticket.comments?.trim() && (
        <>
          <hr className="KitchenTicketPrint__rule" />
          <p className="KitchenTicketPrint__note">
            <span className="KitchenTicketPrint__note-label">{t('kitchenTicket.note')}: </span>
            {ticket.comments.trim()}
          </p>
        </>
      )}
      {ticket.customerName?.trim() && (
        <>
          <hr className="KitchenTicketPrint__rule" />
          <p className="KitchenTicketPrint__customer">{ticket.customerName.trim()}</p>
        </>
      )}
      <hr className="KitchenTicketPrint__rule" />
    </article>
  );
}

export default function KitchenTicketPrint(props: {
  match: { params: { hashId: string; orderId: string } };
  history: { push: (path: string) => void };
}) {
  const { t } = useTranslation();
  const hashId = props.match.params.hashId;
  const orderId = parseInt(props.match.params.orderId, 10);
  const autoPrint = useQueryFlag('print');
  const { merchant, error: merchantError } = useMerchantHashRoute(hashId, t);
  const [ticket, setTicket] = useState<KitchenTicket | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (!merchant || Number.isNaN(orderId)) return;
    let cancelled = false;

    fetchApi(`/api/merchants/${merchant.id}/orders/${orderId}/kitchen-ticket`)
      .then((data: { kitchenTicket: KitchenTicket }) => {
        if (!cancelled) setTicket(data.kitchenTicket);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message || t('kitchenTicket.loadFailed'));
      });

    return () => {
      cancelled = true;
    };
  }, [merchant, orderId, t]);

  useEffect(() => {
    if (!ticket || !autoPrint || printed) return;
    const timer = window.setTimeout(() => {
      window.print();
      setPrinted(true);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [ticket, autoPrint, printed]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleBack = useCallback(() => {
    props.history.push(merchantDashboardPath(hashId));
  }, [props.history, hashId]);

  if (merchantError) {
    return (
      <div className="KitchenTicketPrint">
        <p className="KitchenTicketPrint__error">{merchantError}</p>
      </div>
    );
  }

  if (!merchant || ticket === null && !loadError) {
    return (
      <div className="KitchenTicketPrint">
        <p className="KitchenTicketPrint__loading">{t('common.loading')}</p>
      </div>
    );
  }

  if (loadError || !ticket) {
    return (
      <div className="KitchenTicketPrint">
        <p className="KitchenTicketPrint__error">{loadError || t('kitchenTicket.loadFailed')}</p>
        <div className="KitchenTicketPrint__toolbar">
          <button type="button" className="KitchenTicketPrint__btn KitchenTicketPrint__btn--secondary" onClick={handleBack}>
            {t('merchant.backToOrders')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="KitchenTicketPrint">
      <div className="KitchenTicketPrint__toolbar">
        <button type="button" className="KitchenTicketPrint__btn" onClick={handlePrint}>
          {t('kitchenTicket.print')}
        </button>
        <button type="button" className="KitchenTicketPrint__btn KitchenTicketPrint__btn--secondary" onClick={handleBack}>
          {t('merchant.backToOrders')}
        </button>
      </div>
      <KitchenTicketBody ticket={ticket} t={t} />
    </div>
  );
}
