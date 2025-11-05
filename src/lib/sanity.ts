import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'new',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: '2024-01-01',
})

// Write client for creating documents (uses API token)
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'new',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: string | object) {
  return builder.image(source)
}

// GROQ queries for events
export const eventQueries = {
  // Get all published events, ordered by date
  allEvents: `*[_type == "event" && published == true] | order(coalesce(eventSchedule[0].startTime, "9999-12-31T00:00:00Z") asc) {
    _id,
    title,
    slug,
    description,
    featuredImage,
    eventSchedule,
    location,
    registrationLink,
    price,
    onlinePrice,
    category,
    featured,
    registrationType,
    registrationLimit,
    registrationClosed,
    requiresKingdomBuilderDiscount,
    registrationDeadline,
    registrationInstructions,
    restreamEmbedCode,
    livestreamEnabled
  }`,

  // Get featured events for homepage
  featuredEvents: `*[_type == "event" && published == true && featured == true] | order(coalesce(eventSchedule[0].startTime, "9999-12-31T00:00:00Z") asc) [0...3] {
    _id,
    title,
    slug,
    description,
    featuredImage,
    eventSchedule,
    location,
    registrationLink,
    price,
    onlinePrice,
    category,
    registrationType,
    registrationLimit,
    registrationClosed,
    requiresKingdomBuilderDiscount,
    registrationDeadline,
    registrationInstructions,
    restreamEmbedCode,
    livestreamEnabled
  }`,

  // Get upcoming events (including TBD events)
  upcomingEvents: `*[_type == "event" && published == true && (eventSchedule[0].startTime >= now() || !defined(eventSchedule[0].startTime))] | order(coalesce(eventSchedule[0].startTime, "9999-12-31T00:00:00Z") asc) {
    _id,
    title,
    slug,
    description,
    featuredImage,
    eventSchedule,
    location,
    registrationLink,
    price,
    onlinePrice,
    category,
    featured,
    registrationType,
    registrationLimit,
    registrationClosed,
    requiresKingdomBuilderDiscount,
    registrationDeadline,
    registrationInstructions,
    restreamEmbedCode,
    livestreamEnabled
  }`,

  // Get single event by slug
  eventBySlug: `*[_type == "event" && slug.current == $slug && published == true][0] {
    _id,
    title,
    slug,
    description,
    content,
    featuredImage,
    eventSchedule,
    location,
    registrationLink,
    price,
    onlinePrice,
    capacity,
    category,
    registrationType,
    registrationLimit,
    registrationClosed,
    requiresKingdomBuilderDiscount,
    registrationDeadline,
    registrationInstructions,
    restreamEmbedCode,
    livestreamEnabled
  }`,
}

// GROQ queries for past events
export const pastEventQueries = {
  // Get all active past events, ordered by publish date
  allPastEvents: `*[_type == "pastEvent" && isActive == true] | order(publishedAt desc) {
    _id,
    title,
    slug,
    description,
    thumbnail,
    eventDate,
    duration,
    price,
    category,
    speakers,
    tags,
    featured,
    publishedAt
  }`,

  // Get featured past events
  featuredPastEvents: `*[_type == "pastEvent" && isActive == true && featured == true] | order(publishedAt desc) [0...6] {
    _id,
    title,
    slug,
    description,
    thumbnail,
    eventDate,
    duration,
    price,
    category,
    speakers,
    featured,
    publishedAt
  }`,

  // Get single past event by slug (full details including embed code)
  pastEventBySlug: `*[_type == "pastEvent" && slug.current == $slug && isActive == true][0] {
    _id,
    title,
    slug,
    description,
    content,
    thumbnail,
    eventDate,
    duration,
    vimeoEmbedCode,
    price,
    category,
    speakers,
    tags,
    featured,
    isActive,
    publishedAt,
    "relatedEvents": relatedEvents[]->{
      _id,
      title,
      slug,
      thumbnail,
      price,
      category
    }
  }`,

  // Get past events by category
  pastEventsByCategory: `*[_type == "pastEvent" && isActive == true && category == $category] | order(publishedAt desc) {
    _id,
    title,
    slug,
    description,
    thumbnail,
    eventDate,
    duration,
    price,
    category,
    speakers,
    publishedAt
  }`,
}

// TypeScript interfaces
export interface EventSession {
  startTime: string // DateTime in ISO format
  endTime: string // DateTime in ISO format
  sessionTitle?: string
  notes?: string
}

export interface SanityEvent {
  _id: string
  title: string
  slug: {
    current: string
  }
  description: string
  content?: Array<{
    _type: string;
    _key: string;
    [key: string]: unknown;
  }>
  featuredImage?: {
    asset: {
      _ref: string
    }
    alt?: string
  }
  eventSchedule: EventSession[]
  location?: {
    name?: string
    address?: string
  }
  registrationLink?: string
  price?: number
  capacity?: number
  category?: string
  featured?: boolean
  registrationType?: 'internal' | 'internal-free' | 'hybrid' | 'external' | 'none'
  registrationLimit?: number
  registrationClosed?: boolean
  requiresKingdomBuilderDiscount?: boolean
  registrationDeadline?: string
  registrationInstructions?: string
  // Livestream fields for hybrid events
  onlinePrice?: number
  restreamEmbedCode?: string
  livestreamEnabled?: boolean
}

// Event Registration interfaces
export interface RegistrationAttendee {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

export interface RegistrationCustomer {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
}

export interface RegistrationPayment {
  stripePaymentIntentId: string
  amount: number
  originalPrice?: number
  discountApplied?: boolean
  discountAmount?: number
  paymentMethod?: 'card' | 'free' | 'online'
  status?: 'completed' | 'pending' | 'failed' | 'refunded'
}

export interface SanityEventRegistration {
  _type: 'eventRegistration'
  event: {
    _type: 'reference'
    _ref: string
  }
  attendee: RegistrationAttendee
  customer?: RegistrationCustomer
  payment?: RegistrationPayment // Optional for free events
  attendanceType?: 'in-person' | 'online' // For hybrid events
  registrationDate: string
  status?: 'confirmed' | 'cancelled' | 'no-show' | 'checked-in'
  emailsSent?: Array<{
    type: 'confirmation' | 'reminder-1week' | 'reminder-1day' | 'custom'
    sentAt: string
    subject?: string
  }>
  notes?: string
}

// Past Event interfaces
export interface SanityPastEvent {
  _id: string
  title: string
  slug: {
    current: string
  }
  originalEvent?: {
    _type: 'reference'
    _ref: string
  }
  thumbnail: {
    asset: {
      _ref: string
    }
    alt?: string
  }
  description: string
  content?: Array<{
    _type: string;
    _key: string;
    [key: string]: unknown;
  }>
  eventDate: string
  duration?: string
  vimeoEmbedCode: string
  price: number
  category: string
  speakers?: string[]
  tags?: string[]
  featured: boolean
  isActive: boolean
  publishedAt: string
  relatedEvents?: Array<{
    _id: string
    title: string
    slug: { current: string }
    thumbnail: { asset: { _ref: string } }
    price: number
    category: string
  }>
}

// Livestream Access interface (updated to support past events)
export interface SanityLivestreamAccess {
  _type: 'livestreamAccess'
  _id: string
  contentType: 'event' | 'pastEvent'
  event?: {
    _type: 'reference'
    _ref: string
  }
  pastEvent?: {
    _type: 'reference'
    _ref: string
  }
  eventRegistration?: {
    _type: 'reference'
    _ref: string
  }
  accessType: 'purchased' | 'complimentary' | 'admin'
  accessToken: string
  attendeeEmail: string
  attendeeName: string
  isActive: boolean
  createdAt: string
  lastAccessed?: string
  accessCount: number
}

// Event Registration functions
export async function createEventRegistration(registrationData: SanityEventRegistration) {
  try {
    const result = await writeClient.create(registrationData)
    console.log('Created event registration:', result._id)
    return result
  } catch (error) {
    console.error('Error creating event registration:', error)
    throw error
  }
}

export async function getEventRegistrations(eventId: string) {
  try {
    const registrations = await client.fetch(
      `*[_type == "eventRegistration" && event._ref == $eventId] | order(registrationDate desc) {
        _id,
        attendee,
        customer,
        payment,
        registrationDate,
        status,
        emailsSent,
        notes
      }`,
      { eventId }
    )
    return registrations
  } catch (error) {
    console.error('Error fetching event registrations:', error)
    throw error
  }
}

export async function getEventRegistrationStats(eventId: string) {
  try {
    const stats = await client.fetch(
      `{
        "totalRegistrations": count(*[_type == "eventRegistration" && event._ref == $eventId && status != "cancelled"]),
        "totalRevenue": math::sum(*[_type == "eventRegistration" && event._ref == $eventId && status != "cancelled"].payment.amount),
        "statusBreakdown": *[_type == "eventRegistration" && event._ref == $eventId] | {
          "status": status,
          "count": count(*)
        } | group(status),
        "recentRegistrations": *[_type == "eventRegistration" && event._ref == $eventId] | order(registrationDate desc) [0...5] {
          _id,
          attendee,
          registrationDate,
          status,
          payment.amount
        }
      }`,
      { eventId }
    )
    return stats
  } catch (error) {
    console.error('Error fetching event registration stats:', error)
    throw error
  }
} 