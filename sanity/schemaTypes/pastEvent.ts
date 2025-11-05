import {defineField, defineType} from 'sanity'

export default defineType({
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
      description: 'Detailed description of the event and what viewers will learn',
    }),
    defineField({
      name: 'eventDate',
      title: 'Original Event Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      description: 'When this event originally took place',
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
  preview: {
    select: {
      title: 'title',
      eventDate: 'eventDate',
      media: 'thumbnail',
      isActive: 'isActive',
    },
    prepare(selection) {
      const {title, eventDate, media, isActive} = selection
      let subtitle = 'No date set'

      if (eventDate) {
        const date = new Date(eventDate)
        subtitle = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }

      if (!isActive) {
        subtitle = `${subtitle} • Inactive`
      }

      return {
        title,
        subtitle,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Published Date, Newest',
      name: 'publishedDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
    {
      title: 'Event Date, Newest',
      name: 'eventDateDesc',
      by: [{field: 'eventDate', direction: 'desc'}],
    },
    {
      title: 'Event Date, Oldest',
      name: 'eventDateAsc',
      by: [{field: 'eventDate', direction: 'asc'}],
    },
  ],
})
