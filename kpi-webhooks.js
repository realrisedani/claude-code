/**
 * kpi-webhooks.js — Webhook-Parser für Auto-Tracking
 *
 * Extrahiert relevante Felder aus externen Webhook-Payloads.
 * Kein DOM, keine Side Effects — 100% testbar.
 *
 * Unterstützte Plattformen:
 *   - Calendly (Calls gebucht / erschienen)
 *   - Stripe (Abschlüsse / Umsatz)
 *   - Digistore24 (Verkäufe / Provision)
 */

/**
 * parseCalendlyEvent — extrahiert relevante Felder aus einem Calendly Webhook
 * Unterstützte Event-Typen:
 *   - invitee.created  → callsBooked + 1
 *   - invitee.canceled → callsBooked - 1
 *   - invitee_no_show  → callsShown - 1 (Host markiert No-Show)
 */
export function parseCalendlyEvent(payload) {
  if (!payload?.event || !payload?.payload) {
    return { error: 'Ungültiges Calendly-Payload' };
  }

  const { event, payload: data } = payload;
  const validEvents = ['invitee.created', 'invitee.canceled', 'invitee.reschedule'];

  if (!validEvents.includes(event) && !event.includes('no_show')) {
    return { error: `Unbekannter Event-Typ: ${event}` };
  }

  return {
    eventType:    event,
    inviteeName:  data.invitee?.name  || null,
    inviteeEmail: data.invitee?.email || null,
    startTime:    data.event?.start_time || null,
    endTime:      data.event?.end_time   || null,
    eventName:    data.event_type?.name  || null,
    isBooking:    event === 'invitee.created',
    isCanceled:   event === 'invitee.canceled',
    isNoShow:     event?.includes('no_show') || false,
  };
}

/**
 * parseStripeEvent — extrahiert Umsatzdaten aus einem Stripe Webhook
 * Unterstützte Event-Typen:
 *   - payment_intent.succeeded → Abschluss + Umsatz
 *   - charge.refunded          → Storno
 */
export function parseStripeEvent(payload) {
  if (!payload?.type || !payload?.data?.object) {
    return { error: 'Ungültiges Stripe-Payload' };
  }

  const { type, data } = payload;
  const obj = data.object;

  if (type === 'payment_intent.succeeded') {
    return {
      eventType:     'payment_succeeded',
      amount:        (obj.amount_received || obj.amount || 0) / 100, // Cents → Euro
      currency:      obj.currency?.toUpperCase() || 'EUR',
      customerEmail: obj.receipt_email || null,
      paymentId:     obj.id,
      isClose:       true,
      isRefund:      false,
    };
  }

  if (type === 'charge.refunded') {
    return {
      eventType:     'refund',
      amount:        -(obj.amount_refunded || 0) / 100,
      currency:      obj.currency?.toUpperCase() || 'EUR',
      customerEmail: obj.receipt_email || null,
      paymentId:     obj.payment_intent || obj.id,
      isClose:       false,
      isRefund:      true,
    };
  }

  return { error: `Nicht unterstützter Stripe-Event: ${type}` };
}

/**
 * parseDigistore24IPN — extrahiert Verkaufsdaten aus Digistore24 IPN
 */
export function parseDigistore24IPN(params) {
  if (!params || !params.order_id) {
    return { error: 'Ungültiges Digistore24-Payload — order_id fehlt' };
  }

  const isAffiliate  = !!params.affiliate;
  const grossRevenue = parseFloat(params.order_gross      || 0);
  const commission   = parseFloat(params.affiliate_earning || 0);

  return {
    orderId:     params.order_id,
    productName: params.product_name || null,
    buyerEmail:  params.buyer_email  || null,
    revenue:     grossRevenue,
    commission:  isAffiliate ? commission : 0,
    isAffiliate,
    isRefund:    params.event === 'order_refunded',
    isClose:     params.event === 'order_completed' || params.event === 'payment_successful',
    eventType:   params.event || 'unknown',
  };
}
