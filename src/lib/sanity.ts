import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'new',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: '2024-01-01',
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

// GROQ queries for events
export const eventQueries = {
  // Get all published events, ordered by date
  allEvents: `*[_type == "event" && published == true] | order(eventSchedule[0].startTime asc) {
    _id,
    title,
    slug,
    description,
    featuredImage,
    eventSchedule,
    location,
    registrationLink,
    price,
    category,
    featured
  }`,

  // Get featured events for homepage
  featuredEvents: `*[_type == "event" && published == true && featured == true] | order(eventSchedule[0].startTime asc) [0...3] {
    _id,
    title,
    slug,
    description,
    featuredImage,
    eventSchedule,
    location,
    registrationLink,
    price,
    category
  }`,

  // Get upcoming events
  upcomingEvents: `*[_type == "event" && published == true && eventSchedule[0].startTime >= now()] | order(eventSchedule[0].startTime asc) {
    _id,
    title,
    slug,
    description,
    featuredImage,
    eventSchedule,
    location,
    registrationLink,
    price,
    category,
    featured
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
    capacity,
    category
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
  content?: any[]
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
} 