import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'eventRegistration',
  title: 'Event Registration',
  type: 'document',
  fields: [
    defineField({
      name: 'event',
      title: 'Event',
      type: 'reference',
      to: [{type: 'event'}],
      validation: (Rule) => Rule.required(),
      description: 'The event this registration is for',
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
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'lastName',
          title: 'Last Name',
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
          title: 'Phone',
          type: 'string',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'customer',
      title: 'Billing Information',
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
        {
          name: 'address',
          title: 'Address',
          type: 'text',
        },
        {
          name: 'city',
          title: 'City',
          type: 'string',
        },
        {
          name: 'state',
          title: 'State',
          type: 'string',
        },
        {
          name: 'zipCode',
          title: 'ZIP Code',
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
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'amount',
          title: 'Amount Paid',
          type: 'number',
          description: 'Final amount paid (after discounts)',
          validation: (Rule) => Rule.required().min(0),
        },
        {
          name: 'originalPrice',
          title: 'Original Price',
          type: 'number',
          description: 'Original event price before discounts',
          validation: (Rule) => Rule.min(0),
        },
        {
          name: 'discountApplied',
          title: 'Discount Applied',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'discountAmount',
          title: 'Discount Amount',
          type: 'number',
          description: 'Dollar amount of discount applied',
          validation: (Rule) => Rule.min(0),
        },
        {
          name: 'paymentMethod',
          title: 'Payment Method',
          type: 'string',
          options: {
            list: [
              {title: 'Credit Card', value: 'card'},
              {title: 'Free Registration', value: 'free'},
            ],
          },
          initialValue: 'card',
        },
        {
          name: 'status',
          title: 'Payment Status',
          type: 'string',
          options: {
            list: [
              {title: 'Completed', value: 'completed'},
              {title: 'Pending', value: 'pending'},
              {title: 'Failed', value: 'failed'},
              {title: 'Refunded', value: 'refunded'},
            ],
          },
          initialValue: 'completed',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'registrationDate',
      title: 'Registration Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'status',
      title: 'Registration Status',
      type: 'string',
      options: {
        list: [
          {title: 'Confirmed', value: 'confirmed'},
          {title: 'Cancelled', value: 'cancelled'},
          {title: 'No Show', value: 'no-show'},
          {title: 'Checked In', value: 'checked-in'},
        ],
      },
      initialValue: 'confirmed',
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
              options: {
                list: [
                  {title: 'Registration Confirmation', value: 'confirmation'},
                  {title: '1 Week Reminder', value: 'reminder-1week'},
                  {title: '1 Day Reminder', value: 'reminder-1day'},
                  {title: 'Custom Reminder', value: 'custom'},
                ],
              },
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
          preview: {
            select: {
              type: 'type',
              sentAt: 'sentAt',
              subject: 'subject',
            },
            prepare(selection) {
              const {type, sentAt, subject} = selection
              const date = sentAt ? new Date(sentAt).toLocaleDateString() : 'Unknown'
              return {
                title: subject || type,
                subtitle: `Sent: ${date}`,
              }
            },
          },
        },
      ],
      description: 'Track emails sent to this registrant',
    }),
    defineField({
      name: 'notes',
      title: 'Admin Notes',
      type: 'text',
      rows: 3,
      description: 'Internal notes about this registration',
    }),
  ],
  preview: {
    select: {
      attendeeFirstName: 'attendee.firstName',
      attendeeLastName: 'attendee.lastName',
      attendeeEmail: 'attendee.email',
      eventTitle: 'event.title',
      registrationDate: 'registrationDate',
      status: 'status',
      amount: 'payment.amount',
    },
    prepare(selection) {
      const {
        attendeeFirstName,
        attendeeLastName,
        attendeeEmail,
        eventTitle,
        registrationDate,
        status,
        amount,
      } = selection
      
      const attendeeName = `${attendeeFirstName || ''} ${attendeeLastName || ''}`.trim()
      const date = registrationDate
        ? new Date(registrationDate).toLocaleDateString()
        : 'Unknown'
      
      return {
        title: attendeeName || attendeeEmail || 'Unknown Attendee',
        subtitle: `${eventTitle || 'Unknown Event'} • $${amount || 0} • ${status || 'unknown'} • ${date}`,
      }
    },
  },
  orderings: [
    {
      title: 'Registration Date, Newest',
      name: 'registrationDateDesc',
      by: [{field: 'registrationDate', direction: 'desc'}],
    },
    {
      title: 'Registration Date, Oldest',
      name: 'registrationDateAsc',
      by: [{field: 'registrationDate', direction: 'asc'}],
    },
    {
      title: 'Event Title',
      name: 'eventTitle',
      by: [{field: 'event.title', direction: 'asc'}],
    },
    {
      title: 'Attendee Name',
      name: 'attendeeName',
      by: [{field: 'attendee.lastName', direction: 'asc'}],
    },
  ],
})
