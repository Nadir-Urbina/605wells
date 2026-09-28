import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'promoCode',
  title: 'Promo Code',
  type: 'document',
  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      type: 'string',
      description:
        'What the attendee types at checkout. Not case-sensitive for them, but keep it short and memorable (e.g. KINGDOM50).',
      validation: (Rule) => Rule.required().min(3).max(40),
    }),
    defineField({
      name: 'description',
      title: 'Internal Description',
      type: 'string',
      description: 'For your own reference — shown to staff, not to attendees.',
    }),
    defineField({
      name: 'discountPercent',
      title: 'Discount Percent',
      type: 'number',
      description: 'Percent off the ticket price. 50 means half price.',
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Turn this off to disable the code immediately, without deleting its history.',
      initialValue: true,
    }),
    defineField({
      name: 'validFrom',
      title: 'Valid From',
      type: 'datetime',
      description: 'Optional. Before this date the code will not work. Leave empty to start right away.',
    }),
    defineField({
      name: 'validUntil',
      title: 'Valid Until',
      type: 'datetime',
      description: 'Optional. After this date the code stops working. Leave empty for no expiry.',
    }),
    defineField({
      name: 'usageLimit',
      title: 'Usage Limit',
      type: 'number',
      description:
        'Optional. Maximum number of registrations that can use this code. Leave empty for unlimited.',
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({
      name: 'applicableEvents',
      title: 'Limit To Specific Events',
      type: 'array',
      description: 'Leave empty to allow this code on every event. Add events to restrict it to those only.',
      of: [{ type: 'reference', to: [{ type: 'event' }] }],
    }),
  ],
  preview: {
    select: { code: 'code', percent: 'discountPercent', active: 'active', description: 'description' },
    prepare({ code, percent, active, description }) {
      return {
        title: `${code}${active === false ? ' (inactive)' : ''}`,
        subtitle: `${percent}% off${description ? ` — ${description}` : ''}`,
      }
    },
  },
})
