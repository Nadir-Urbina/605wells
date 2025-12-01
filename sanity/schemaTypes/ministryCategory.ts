import {defineField, defineType} from 'sanity'

export default defineType({
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
  preview: {
    select: {
      title: 'name',
      active: 'active',
      order: 'order',
    },
    prepare(selection) {
      const {title, active, order} = selection
      return {
        title,
        subtitle: `${active ? '✓ Active' : '✗ Inactive'} • Order: ${order}`,
      }
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
    {
      title: 'Name',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
  ],
})
