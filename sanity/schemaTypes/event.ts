import {defineField, defineType} from 'sanity'

export default defineType({
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
              description: 'Select the start date and time for this session',
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
              description: 'Select the end date and time for this session',
            },
            {
              name: 'sessionTitle',
              title: 'Session Title (Optional)',
              type: 'string',
              description: 'e.g., "Opening Night", "Workshop Session", "Prayer Meeting"',
            },
            {
              name: 'notes',
              title: 'Additional Notes (Optional)',
              type: 'text',
              rows: 2,
              description: 'Any special notes for this session',
            },
          ],
          preview: {
            select: {
              date: 'date',
              startTime: 'startTime',
              endTime: 'endTime',
              sessionTitle: 'sessionTitle',
            },
            prepare(selection) {
              const { startTime, endTime, sessionTitle } = selection;
              
              if (!startTime) {
                return {
                  title: sessionTitle || 'New Session',
                  subtitle: 'No date/time set',
                };
              }
              
              const startDate = new Date(startTime);
              const endDate = new Date(endTime);
              
              const dayName = startDate.toLocaleDateString('en-US', { weekday: 'long' });
              const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              
              const timeRange = `${startDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })} - ${endDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}`;
              
              return {
                title: sessionTitle || `${dayName}, ${dateStr}`,
                subtitle: timeRange,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).error('Please add at least one session'),
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
      description: 'External registration link (will be replaced with Stripe integration later)',
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'Event price (0 for free events)',
    }),
    defineField({
      name: 'capacity',
      title: 'Event Capacity',
      type: 'number',
      description: 'Maximum number of attendees (optional)',
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
      description: 'Show this event prominently on the homepage',
      initialValue: false,
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Ready to display on the website',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      eventSchedule: 'eventSchedule',
      media: 'featuredImage',
    },
    prepare(selection) {
      const {title, eventSchedule, media} = selection
      let subtitle = 'No dates set'
      
      if (eventSchedule && eventSchedule.length > 0) {
        const firstSession = eventSchedule[0]
        if (firstSession.date) {
          const date = new Date(firstSession.date)
          if (eventSchedule.length === 1) {
            subtitle = date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })
          } else {
            subtitle = `${date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} + ${eventSchedule.length - 1} more`
          }
        }
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
      title: 'Event Date, Newest',
      name: 'eventDateDesc',
      by: [{field: 'eventSchedule.0.date', direction: 'desc'}],
    },
    {
      title: 'Event Date, Oldest',
      name: 'eventDateAsc',
      by: [{field: 'eventSchedule.0.date', direction: 'asc'}],
    },
  ],
}) 