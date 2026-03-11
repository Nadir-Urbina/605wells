import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({
      name: 'firstName',
      title: 'First Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Last Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
      description: 'Brief description about the team member',
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'Staff Member (Paid Sessions)', value: 'staff' },
          { title: 'Volunteer (Free Sessions)', value: 'volunteer' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ministryTypes',
      title: 'Ministry Types Offered',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'ministryType' }] }],
      validation: (Rule) => Rule.required().min(1),
      description: 'Which ministry types can this team member lead?',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this team member is currently available for sessions',
      initialValue: true,
    }),
    defineField({
      name: 'firebaseUid',
      title: 'Firebase Auth UID',
      type: 'string',
      readOnly: true,
      description: 'Auto-populated when team member account is created by admin',
    }),
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      media: 'avatar',
      role: 'role',
      active: 'active',
    },
    prepare({ firstName, lastName, media, role, active }) {
      const roleLabel = role === 'staff' ? 'Staff' : 'Volunteer';
      return {
        title: `${firstName} ${lastName}${!active ? ' (Inactive)' : ''}`,
        subtitle: roleLabel,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Name (A-Z)',
      name: 'nameAsc',
      by: [
        { field: 'firstName', direction: 'asc' },
        { field: 'lastName', direction: 'asc' },
      ],
    },
    {
      title: 'Role',
      name: 'roleAsc',
      by: [{ field: 'role', direction: 'asc' }],
    },
  ],
});
