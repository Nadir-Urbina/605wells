import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'ministryType',
  title: 'Ministry Type',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
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
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'averageDuration',
      title: 'Average Session Duration (minutes)',
      type: 'number',
      validation: (Rule) => Rule.required().min(15).max(240),
    }),
    defineField({
      name: 'costType',
      title: 'Cost Type',
      type: 'string',
      options: {
        list: [
          { title: 'Free Only', value: 'free' },
          { title: 'Paid Only', value: 'paid' },
          { title: 'Both Free & Paid', value: 'both' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (USD)',
      type: 'number',
      hidden: ({ document }) => document?.costType === 'free',
      validation: (Rule) =>
        Rule.custom((price, context) => {
          const costType = (context.document as any)?.costType;
          if (costType === 'paid' || costType === 'both') {
            if (!price || price <= 0) {
              return 'Price is required for paid sessions';
            }
          }
          return true;
        }).min(0),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Show this ministry type on the Virtual Hub page',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 0,
    }),
    defineField({
      name: 'icon',
      title: 'Icon Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'intakeFormQuestions',
      title: 'Intake Form Questions',
      type: 'array',
      description: 'Questions to ask users before their session',
      of: [
        {
          type: 'object',
          name: 'question',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'type',
              title: 'Question Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Short Text', value: 'text' },
                  { title: 'Long Text (Paragraph)', value: 'textarea' },
                  { title: 'Single Choice', value: 'select' },
                  { title: 'Multiple Choice', value: 'multiselect' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'required',
              title: 'Required',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'options',
              title: 'Answer Options',
              type: 'array',
              of: [{ type: 'string' }],
              hidden: ({ parent }) =>
                !['select', 'multiselect'].includes(parent?.type),
              validation: (Rule) =>
                Rule.custom((options, context) => {
                  const questionType = (context.parent as { type?: string })?.type;
                  if (
                    questionType && ['select', 'multiselect'].includes(questionType) &&
                    (!options || (options as string[]).length === 0)
                  ) {
                    return 'Options are required for select/multiselect questions';
                  }
                  return true;
                }),
            },
            {
              name: 'placeholder',
              title: 'Placeholder Text',
              type: 'string',
              description: 'Helpful hint shown in the input field',
            },
          ],
          preview: {
            select: {
              title: 'question',
              subtitle: 'type',
              required: 'required',
            },
            prepare({ title, subtitle, required }) {
              return {
                title: title || 'Untitled Question',
                subtitle: `${subtitle || 'text'}${required ? ' (Required)' : ''}`,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'followUpResources',
      title: 'Follow-up Resources',
      type: 'array',
      description: 'Resources sent to users after their session',
      of: [
        {
          type: 'object',
          name: 'resource',
          fields: [
            {
              name: 'title',
              title: 'Resource Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'url',
              title: 'Resource URL',
              type: 'url',
              validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            },
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'url',
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      media: 'icon',
      active: 'active',
    },
    prepare({ title, subtitle, media, active }) {
      return {
        title: `${title}${!active ? ' (Inactive)' : ''}`,
        subtitle: subtitle,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Title',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
});
