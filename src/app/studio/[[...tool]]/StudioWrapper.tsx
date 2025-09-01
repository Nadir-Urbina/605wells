'use client'

import dynamic from 'next/dynamic'
import { defineConfig, defineField, defineType } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'

const NextStudio = dynamic(
  () => import('next-sanity/studio').then((mod) => mod.NextStudio),
  { ssr: false }
)

// Define event schema directly here to avoid type conflicts
const eventSchema = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        },
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
          options: {hotspot: true},
        },
      ],
    }),
    defineField({
      name: 'eventSchedule',
      title: 'Event Schedule',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Session',
          fields: [
            {
              name: 'startTime',
              title: 'Start Date & Time',
              type: 'datetime',
              options: {
                timeStep: 15,
                calendarTodayLabel: 'Today'
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'endTime',
              title: 'End Date & Time',
              type: 'datetime',
              options: {
                timeStep: 15,
                calendarTodayLabel: 'Today'
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'sessionTitle',
              title: 'Session Title (Optional)',
              type: 'string',
            },
            {
              name: 'notes',
              title: 'Additional Notes (Optional)',
              type: 'text',
              rows: 2,
            },
          ],
        },
      ],
      validation: (Rule) => Rule.min(1).error('Please add at least one session'),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Venue Name',
          type: 'string',
        },
        {
          name: 'address',
          title: 'Address',
          type: 'text',
          rows: 3,
        },
      ],
    }),
    defineField({
      name: 'registrationLink',
      title: 'Registration Link',
      type: 'url',
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
    }),
    defineField({
      name: 'capacity',
      title: 'Event Capacity',
      type: 'number',
    }),
    defineField({
      name: 'category',
      title: 'Event Category',
      type: 'string',
      options: {
        list: [
          {title: 'Worship Service', value: 'worship'},
          {title: 'Teaching & Discipleship', value: 'teaching'},
          {title: 'Prayer & Intercession', value: 'prayer'},
          {title: 'Community Outreach', value: 'outreach'},
          {title: 'Youth Ministry', value: 'youth'},
          {title: 'Special Event', value: 'special'},
          {title: 'Conference', value: 'conference'},
          {title: 'Fellowship', value: 'fellowship'},
        ],
      },
    }),
    defineField({
      name: 'featured',
      title: 'Featured Event',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'registrationType',
      title: 'Registration Type',
      type: 'string',
      options: {
        list: [
          {title: 'Internal Registration (Stripe)', value: 'internal'},
          {title: 'External Registration Link', value: 'external'},
          {title: 'No Registration Required', value: 'none'},
        ],
      },
      initialValue: 'external',
    }),
    defineField({
      name: 'registrationLimit',
      title: 'Registration Limit',
      type: 'number',
    }),
    defineField({
      name: 'registrationClosed',
      title: 'Registration Closed',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'requiresKingdomBuilderDiscount',
      title: 'Apply Kingdom Builder Discount',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'registrationDeadline',
      title: 'Registration Deadline',
      type: 'datetime',
    }),
    defineField({
      name: 'registrationInstructions',
      title: 'Registration Instructions',
      type: 'text',
      rows: 3,
    }),
  ],
})

// Define event registration schema
const eventRegistrationSchema = defineType({
  name: 'eventRegistration',
  title: 'Event Registration',
  type: 'document',
  fields: [
    defineField({
      name: 'event',
      title: 'Event',
      type: 'reference',
      to: [{type: 'event'}],
    }),
    defineField({
      name: 'attendee',
      title: 'Attendee Information',
      type: 'object',
      fields: [
        {
          name: 'firstName',
          title: 'First Name',
          type: 'string',
        },
        {
          name: 'lastName',
          title: 'Last Name',
          type: 'string',
        },
        {
          name: 'email',
          title: 'Email',
          type: 'email',
        },
        {
          name: 'phone',
          title: 'Phone',
          type: 'string',
        },
      ],
    }),
    defineField({
      name: 'payment',
      title: 'Payment Information',
      type: 'object',
      fields: [
        {
          name: 'stripePaymentIntentId',
          title: 'Stripe Payment Intent ID',
          type: 'string',
        },
        {
          name: 'amount',
          title: 'Amount Paid',
          type: 'number',
        },
        {
          name: 'status',
          title: 'Payment Status',
          type: 'string',
        },
      ],
    }),
    defineField({
      name: 'registrationDate',
      title: 'Registration Date',
      type: 'datetime',
    }),
    defineField({
      name: 'status',
      title: 'Registration Status',
      type: 'string',
    }),
  ],
})

const config = defineConfig({
  name: 'default',
  title: '605 Wells Ministry Hub',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ypbczt01',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',
  
  plugins: [structureTool(), visionTool()],
  
  schema: {
    types: [eventSchema, eventRegistrationSchema],
  },
})

export default function StudioWrapper() {
  return <NextStudio config={config} />
}