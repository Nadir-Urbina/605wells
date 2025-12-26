import {defineField, defineType} from 'sanity'

export default defineType({
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
    // Future-proofing: Fields for future scheduling system
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
          preview: {
            select: {
              task: 'task',
              date: 'date',
              status: 'status',
            },
            prepare(selection) {
              const {task, date, status} = selection
              const dateStr = date ? new Date(date).toLocaleDateString() : 'No date'
              return {
                title: task || 'Untitled Task',
                subtitle: `${dateStr} • ${status || 'pending'}`,
              }
            },
          },
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
          preview: {
            select: {
              type: 'type',
              date: 'date',
              subject: 'subject',
            },
            prepare(selection) {
              const {type, date, subject} = selection
              const dateStr = date ? new Date(date).toLocaleDateString() : 'No date'
              return {
                title: subject || type || 'Communication',
                subtitle: `${type} • ${dateStr}`,
              }
            },
          },
        },
      ],
      description: 'Future use: Track all communications with this volunteer',
    }),
  ],
  preview: {
    select: {
      name: 'personalInfo.fullName',
      email: 'personalInfo.email',
      phone: 'personalInfo.phone',
      status: 'status',
      submissionDate: 'submissionDate',
      ministryAreas: 'ministryAreas',
    },
    prepare(selection) {
      const {name, email, phone, status, submissionDate, ministryAreas} = selection
      const date = submissionDate
        ? new Date(submissionDate).toLocaleDateString()
        : 'Unknown'
      const areas = ministryAreas && ministryAreas.length > 0
        ? `${ministryAreas.length} ministry area${ministryAreas.length > 1 ? 's' : ''}`
        : 'No areas selected'

      return {
        title: name || email || 'Unknown Volunteer',
        subtitle: `${status || 'new'} • ${areas} • ${phone || 'No phone'} • ${date}`,
      }
    },
  },
  orderings: [
    {
      title: 'Submission Date, Newest',
      name: 'submissionDateDesc',
      by: [{field: 'submissionDate', direction: 'desc'}],
    },
    {
      title: 'Submission Date, Oldest',
      name: 'submissionDateAsc',
      by: [{field: 'submissionDate', direction: 'asc'}],
    },
    {
      title: 'Name',
      name: 'name',
      by: [{field: 'personalInfo.fullName', direction: 'asc'}],
    },
    {
      title: 'Status',
      name: 'status',
      by: [{field: 'status', direction: 'asc'}],
    },
  ],
})
