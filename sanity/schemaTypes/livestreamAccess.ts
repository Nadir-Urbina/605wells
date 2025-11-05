import {defineField, defineType} from 'sanity'

export default defineType({
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
      description: 'Type of content this token provides access to',
    }),
    defineField({
      name: 'event',
      title: 'Event',
      type: 'reference',
      to: [{type: 'event'}],
      hidden: ({document}) => document?.contentType === 'pastEvent',
      validation: (Rule) => Rule.custom((value, context) => {
        const contentType = (context.document as any)?.contentType
        if (contentType === 'event' && !value) {
          return 'Event reference is required for live events'
        }
        return true
      }),
    }),
    defineField({
      name: 'pastEvent',
      title: 'Past Event',
      type: 'reference',
      to: [{type: 'pastEvent'}],
      hidden: ({document}) => document?.contentType === 'event',
      validation: (Rule) => Rule.custom((value, context) => {
        const contentType = (context.document as any)?.contentType
        if (contentType === 'pastEvent' && !value) {
          return 'Past Event reference is required for recordings'
        }
        return true
      }),
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
      description: 'How this access was granted',
    }),
    defineField({
      name: 'accessToken',
      title: 'Access Token',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Unique token for accessing the livestream',
    }),
    defineField({
      name: 'attendeeEmail',
      title: 'Attendee Email',
      type: 'email',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'attendeeName',
      title: 'Attendee Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Token Active',
      type: 'boolean',
      initialValue: true,
      description: 'Whether this token can be used to access the livestream',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'lastAccessed',
      title: 'Last Accessed',
      type: 'datetime',
      description: 'When the token was last used to access the livestream',
    }),
    defineField({
      name: 'accessCount',
      title: 'Access Count',
      type: 'number',
      initialValue: 0,
      description: 'Number of times this token has been used',
    }),
  ],
  preview: {
    select: {
      attendeeName: 'attendeeName',
      attendeeEmail: 'attendeeEmail',
      isActive: 'isActive',
      event: 'event.title',
      pastEvent: 'pastEvent.title',
      contentType: 'contentType',
      accessType: 'accessType',
    },
    prepare(selection) {
      const {attendeeName, attendeeEmail, isActive, event, pastEvent, contentType, accessType} = selection
      const eventTitle = contentType === 'pastEvent' ? pastEvent : event
      const accessBadge = accessType === 'complimentary' ? '🎁' : accessType === 'admin' ? '👨‍💼' : '💳'

      return {
        title: `${attendeeName} (${attendeeEmail})`,
        subtitle: `${accessBadge} ${eventTitle || 'No event'} - ${isActive ? 'Active' : 'Inactive'}`,
        media: isActive ? '🟢' : '🔴',
      }
    },
  },
})
