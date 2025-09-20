import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'livestreamAccess',
  title: 'Livestream Access Token',
  type: 'document',
  fields: [
    defineField({
      name: 'event',
      title: 'Event',
      type: 'reference',
      to: [{type: 'event'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'eventRegistration',
      title: 'Event Registration',
      type: 'reference',
      to: [{type: 'eventRegistration'}],
      validation: (Rule) => Rule.required(),
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
    },
    prepare(selection) {
      const {attendeeName, attendeeEmail, isActive, event} = selection
      return {
        title: `${attendeeName} (${attendeeEmail})`,
        subtitle: `${event} - ${isActive ? 'Active' : 'Inactive'}`,
        media: isActive ? '🟢' : '🔴',
      }
    },
  },
})
