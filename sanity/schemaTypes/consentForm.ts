import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'consentForm',
  title: 'Deliverance Ministry Consent Form',
  type: 'document',
  fields: [
    defineField({
      name: 'releasorName',
      title: 'Releasor Full Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'releasorEmail',
      title: 'Email Address',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'releasorPhone',
      title: 'Phone Number',
      type: 'string',
    }),
    defineField({
      name: 'dateOfAgreement',
      title: 'Date of Agreement',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'section2Initial',
      title: 'Section 2 Initial (Confidentiality)',
      type: 'string',
      description: 'Initials provided for the confidentiality section',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'signatureDataUrl',
      title: 'Digital Signature (Base64 PNG)',
      type: 'text',
      description: 'Base64-encoded PNG image of the releasor\'s digital signature',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'submissionDate',
      title: 'Submission Date & Time',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'ipAddress',
      title: 'IP Address',
      type: 'string',
      description: 'IP address at time of submission (legal record)',
    }),
    defineField({
      name: 'userAgent',
      title: 'Browser / User Agent',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'New', value: 'new'},
          {title: 'Reviewed', value: 'reviewed'},
          {title: 'Archived', value: 'archived'},
        ],
      },
      initialValue: 'new',
    }),
    defineField({
      name: 'notes',
      title: 'Admin Notes',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      name: 'releasorName',
      email: 'releasorEmail',
      date: 'submissionDate',
      status: 'status',
    },
    prepare(selection) {
      const {name, email, date, status} = selection
      const dateStr = date ? new Date(date).toLocaleDateString() : 'Unknown'
      return {
        title: name || email || 'Unknown',
        subtitle: `${email || ''} • ${status || 'new'} • ${dateStr}`,
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
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [{field: 'releasorName', direction: 'asc'}],
    },
  ],
})
