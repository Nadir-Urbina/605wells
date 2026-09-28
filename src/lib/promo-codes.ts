// Promo codes live in Sanity so staff can create, expire, and disable them
// without a deploy. Everything here runs server-side only: the browser asks
// /api/events/validate-promo for display, but the registration routes always
// re-validate and recompute the price from the event's own Sanity price.

import { liveClient } from './sanity'

export interface SanityPromoCode {
  _id: string
  code: string
  description?: string
  discountPercent: number
  active?: boolean
  validFrom?: string
  validUntil?: string
  usageLimit?: number
  applicableEventIds?: string[]
}

export interface PromoCodeResult {
  valid: boolean
  /** Normalized (uppercase) code, present when valid */
  code?: string
  discountPercent?: number
  description?: string
  /** Attendee-facing reason the code was rejected */
  error?: string
}

const allPromoCodesQuery = `*[_type == "promoCode"]{
  _id,
  code,
  description,
  discountPercent,
  active,
  validFrom,
  validUntil,
  usageLimit,
  "applicableEventIds": applicableEvents[]._ref
}`

const usageCountQuery = `count(*[
  _type == "eventRegistration" &&
  status != "cancelled" &&
  payment.promoCode == $code
])`

export function normalizePromoCode(code: string) {
  return code.trim().toUpperCase()
}

/**
 * Validates a promo code against Sanity.
 *
 * `eventId` is the event's Sanity `_id` — pass it wherever it is known so that
 * codes restricted to specific events are enforced. When it is omitted, the
 * event restriction cannot be checked and a restricted code is rejected.
 */
export async function validatePromoCode(
  rawCode: string | null | undefined,
  eventId?: string
): Promise<PromoCodeResult> {
  const code = rawCode ? normalizePromoCode(rawCode) : ''
  if (!code) {
    return { valid: false, error: 'Please enter a promo code' }
  }

  let promos: SanityPromoCode[]
  try {
    // Matching happens here rather than in GROQ so codes stay case-insensitive
    // for attendees no matter how staff typed them into the studio.
    promos = await liveClient.fetch<SanityPromoCode[]>(allPromoCodesQuery)
  } catch (error) {
    console.error('Error fetching promo codes from Sanity:', error)
    throw error
  }

  const promo = promos.find((p) => p.code && normalizePromoCode(p.code) === code)

  if (!promo) {
    return { valid: false, error: 'Invalid promo code' }
  }

  if (promo.active === false) {
    return { valid: false, error: 'This promo code is no longer active' }
  }

  const now = new Date()

  if (promo.validFrom && now < new Date(promo.validFrom)) {
    return { valid: false, error: 'This promo code is not active yet' }
  }

  if (promo.validUntil && now > new Date(promo.validUntil)) {
    return { valid: false, error: 'This promo code has expired' }
  }

  const restrictedTo = promo.applicableEventIds ?? []
  if (restrictedTo.length > 0 && (!eventId || !restrictedTo.includes(eventId))) {
    return { valid: false, error: 'This promo code is not valid for this event' }
  }

  if (typeof promo.usageLimit === 'number' && promo.usageLimit > 0) {
    const timesUsed = await liveClient.fetch<number>(usageCountQuery, {
      code: normalizePromoCode(promo.code),
    })
    if (timesUsed >= promo.usageLimit) {
      return { valid: false, error: 'This promo code has reached its usage limit' }
    }
  }

  const discountPercent = Math.min(100, Math.max(0, promo.discountPercent || 0))
  if (discountPercent <= 0) {
    return { valid: false, error: 'Invalid promo code' }
  }

  return {
    valid: true,
    code: normalizePromoCode(promo.code),
    discountPercent,
    description: promo.description,
  }
}

/** Discount math, kept in one place so every registration path agrees. */
export function applyPromoDiscount(originalPrice: number, discountPercent: number) {
  const discountAmount = (originalPrice * discountPercent) / 100
  const finalPrice = Math.max(0, originalPrice - discountAmount)
  // Money, so keep it to cents rather than carrying float drift into Stripe.
  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
  }
}
