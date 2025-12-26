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
          {title: 'Internal Registration (Free)', value: 'internal-free'},
          {title: 'Hybrid Event (In-Person + Online)', value: 'hybrid'},
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
    // Livestream Settings for Hybrid Events
    defineField({
      name: 'onlinePrice',
      title: 'Online Attendance Price',
      type: 'number',
    }),
    defineField({
      name: 'restreamEmbedCode',
      title: 'Restream Embed Code',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'livestreamEnabled',
      title: 'Enable Livestream',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})

// Define livestream access schema
const livestreamAccessSchema = defineType({
  name: 'livestreamAccess',
  title: 'Livestream Access Token',
  type: 'document',
  fields: [
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      options: {
        list: [
          {title: 'Live Event', value: 'event'},
          {title: 'Past Event Recording', value: 'pastEvent'},
        ],
      },
      initialValue: 'event',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'event',
      title: 'Event',
      type: 'reference',
      to: [{type: 'event'}],
      hidden: ({document}) => document?.contentType === 'pastEvent',
    }),
    defineField({
      name: 'pastEvent',
      title: 'Past Event',
      type: 'reference',
      to: [{type: 'pastEvent'}],
      hidden: ({document}) => document?.contentType === 'event',
    }),
    defineField({
      name: 'eventRegistration',
      title: 'Event Registration',
      type: 'reference',
      to: [{type: 'eventRegistration'}],
    }),
    defineField({
      name: 'accessType',
      title: 'Access Type',
      type: 'string',
      options: {
        list: [
          {title: 'Purchased', value: 'purchased'},
          {title: 'Complimentary (In-Person Attendee)', value: 'complimentary'},
          {title: 'Admin Generated', value: 'admin'},
        ],
      },
      initialValue: 'purchased',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'accessToken',
      title: 'Access Token',
      type: 'string',
    }),
    defineField({
      name: 'attendeeEmail',
      title: 'Attendee Email',
      type: 'email',
    }),
    defineField({
      name: 'attendeeName',
      title: 'Attendee Name',
      type: 'string',
    }),
    defineField({
      name: 'isActive',
      title: 'Token Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    }),
    defineField({
      name: 'lastAccessed',
      title: 'Last Accessed',
      type: 'datetime',
    }),
    defineField({
      name: 'accessCount',
      title: 'Access Count',
      type: 'number',
      initialValue: 0,
    }),
  ],
})

// Define past event schema
const pastEventSchema = defineType({
  name: 'pastEvent',
  title: 'Past Event',
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
      name: 'originalEvent',
      title: 'Original Event',
      type: 'reference',
      to: [{type: 'event'}],
      description: 'Link to the original event if it exists in the system',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
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
      validation: (Rule) => Rule.required(),
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
      title: 'Full Description',
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
      name: 'eventDate',
      title: 'Original Event Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Video Duration',
      type: 'string',
      description: 'e.g., "2h 30m" or "90 minutes"',
      placeholder: '2h 30m',
    }),
    defineField({
      name: 'vimeoEmbedCode',
      title: 'Vimeo Embed Code',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
      description: 'Full embed code from Vimeo (or other video platform)',
    }),
    defineField({
      name: 'price',
      title: 'Price (USD)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
      description: 'Price to access this recording (use 0 for free)',
      initialValue: 9.99,
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'speakers',
      title: 'Speakers/Teachers',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Names of speakers or teachers featured in this event',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Keywords for searchability (e.g., "prophecy", "healing", "worship")',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show this event prominently on the past events page',
      initialValue: false,
    }),
    defineField({
      name: 'isActive',
      title: 'Active for Purchase',
      type: 'boolean',
      description: 'Make this recording available for purchase',
      initialValue: true,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      description: 'When this recording became available',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'relatedEvents',
      title: 'Related Past Events',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'pastEvent'}]}],
      description: 'Other recordings viewers might be interested in',
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
          name: 'originalPrice',
          title: 'Original Price',
          type: 'number',
        },
        {
          name: 'discountApplied',
          title: 'Discount Applied',
          type: 'boolean',
        },
        {
          name: 'discountAmount',
          title: 'Discount Amount',
          type: 'number',
        },
        {
          name: 'paymentMethod',
          title: 'Payment Method',
          type: 'string',
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
    defineField({
      name: 'emailsSent',
      title: 'Emails Sent',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'type',
              title: 'Email Type',
              type: 'string',
            },
            {
              name: 'sentAt',
              title: 'Sent At',
              type: 'datetime',
            },
            {
              name: 'subject',
              title: 'Email Subject',
              type: 'string',
            },
          ],
        },
      ],
    }),
  ],
})

// Define ministry category schema
const ministryCategorySchema = defineType({
  name: 'ministryCategory',
  title: 'Ministry Category',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Ministry Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Name of the ministry (e.g., "Deliverance", "Inner Healing", "Prophetic Ministry")',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Brief description of this ministry type (optional)',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Show this ministry category in the form dropdown',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which this ministry appears in the dropdown (lower numbers first)',
      initialValue: 0,
    }),
  ],
})

// Define volunteer schema
const volunteerSchema = defineType({
  name: 'volunteer',
  title: 'Volunteer',
  type: 'document',
  fields: [
    defineField({
      name: 'personalInfo',
      title: 'Personal Information',
      type: 'object',
      fields: [
        {
          name: 'fullName',
          title: 'Full Name',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'email',
          title: 'Email',
          type: 'email',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'phone',
          title: 'Phone Number',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ministryAreas',
      title: 'Ministry Areas',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Cleaning', value: 'cleaning'},
          {title: 'Cooking', value: 'cooking'},
          {title: 'Prayer Meetings', value: 'prayer-meetings'},
          {title: 'Preaching', value: 'preaching'},
          {title: 'Teaching', value: 'teaching'},
          {title: 'Lawn Care', value: 'lawn-care'},
          {title: 'Building Maintenance', value: 'building-maintenance'},
          {title: 'Media', value: 'media'},
          {title: 'Worship Team', value: 'worship-team'},
          {title: 'Deliverance and Inner Healing', value: 'deliverance-inner-healing'},
          {title: 'Events Coordination', value: 'events-coordination'},
          {title: 'Decoration', value: 'decoration'},
          {title: 'Child Care', value: 'child-care'},
        ],
      },
      validation: (Rule) => Rule.required().min(1).error('Please select at least one ministry area'),
    }),
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'object',
      fields: [
        {
          name: 'daysOfWeek',
          title: 'Days of Week',
          type: 'array',
          of: [{type: 'string'}],
          options: {
            list: [
              {title: 'Monday', value: 'monday'},
              {title: 'Tuesday', value: 'tuesday'},
              {title: 'Wednesday', value: 'wednesday'},
              {title: 'Thursday', value: 'thursday'},
              {title: 'Friday', value: 'friday'},
              {title: 'Saturday', value: 'saturday'},
              {title: 'Sunday', value: 'sunday'},
            ],
          },
          validation: (Rule) => Rule.required().min(1).error('Please select at least one day'),
        },
        {
          name: 'frequency',
          title: 'Frequency',
          type: 'string',
          options: {
            list: [
              {title: 'Every Week', value: 'weekly'},
              {title: 'Every Two Weeks', value: 'bi-weekly'},
              {title: 'Once a Month', value: 'monthly'},
              {title: 'Occasionally', value: 'occasionally'},
            ],
          },
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'timePreferences',
          title: 'Time Preferences',
          type: 'array',
          of: [{type: 'string'}],
          options: {
            list: [
              {title: 'Morning (6am - 12pm)', value: 'morning'},
              {title: 'Afternoon (12pm - 6pm)', value: 'afternoon'},
              {title: 'Evening (6pm - 10pm)', value: 'evening'},
            ],
          },
          validation: (Rule) => Rule.required().min(1).error('Please select at least one time preference'),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'submissionDate',
      title: 'Submission Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'New', value: 'new'},
          {title: 'Contacted', value: 'contacted'},
          {title: 'Active', value: 'active'},
          {title: 'Inactive', value: 'inactive'},
          {title: 'On Hold', value: 'on-hold'},
        ],
      },
      initialValue: 'new',
      description: 'Current volunteer status for tracking purposes',
    }),
    defineField({
      name: 'notes',
      title: 'Admin Notes',
      type: 'text',
      rows: 4,
      description: 'Internal notes about this volunteer (contact history, assignments, etc.)',
    }),
    defineField({
      name: 'assignments',
      title: 'Assignments',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'task',
              title: 'Task',
              type: 'string',
            },
            {
              name: 'date',
              title: 'Date',
              type: 'datetime',
            },
            {
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                list: [
                  {title: 'Pending', value: 'pending'},
                  {title: 'Accepted', value: 'accepted'},
                  {title: 'Declined', value: 'declined'},
                  {title: 'Completed', value: 'completed'},
                ],
              },
            },
            {
              name: 'notes',
              title: 'Notes',
              type: 'text',
            },
          ],
        },
      ],
      description: 'Future use: Track volunteer assignments and scheduling',
    }),
    defineField({
      name: 'communicationLog',
      title: 'Communication Log',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'type',
              title: 'Communication Type',
              type: 'string',
              options: {
                list: [
                  {title: 'Email', value: 'email'},
                  {title: 'Phone Call', value: 'phone'},
                  {title: 'Text Message', value: 'text'},
                  {title: 'In-Person', value: 'in-person'},
                ],
              },
            },
            {
              name: 'date',
              title: 'Date',
              type: 'datetime',
            },
            {
              name: 'subject',
              title: 'Subject',
              type: 'string',
            },
            {
              name: 'notes',
              title: 'Notes',
              type: 'text',
            },
          ],
        },
      ],
      description: 'Future use: Track all communications with this volunteer',
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
    types: [eventSchema, pastEventSchema, livestreamAccessSchema, eventRegistrationSchema, ministryCategorySchema, volunteerSchema],
  },
})

export default function StudioWrapper() {
  return <NextStudio config={config} />
}