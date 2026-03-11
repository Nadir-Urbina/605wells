'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AdminGuard from '@/components/AdminGuard';

const teamMemberSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['staff', 'volunteer']),
  ministryTypes: z.array(z.string()).min(1, 'Select at least one ministry type'),
  bio: z.string().optional(),
  createPortalAccess: z.boolean(),
  temporaryPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

interface MinistryType {
  _id: string;
  title: string;
}

function CreateTeamMemberContent() {
  const router = useRouter();
  const [ministryTypes, setMinistryTypes] = useState<MinistryType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      role: 'staff',
      createPortalAccess: true,
      ministryTypes: [],
    },
  });

  const createPortalAccess = watch('createPortalAccess');

  useEffect(() => {
    fetchMinistryTypes();
  }, []);

  const fetchMinistryTypes = async () => {
    try {
      const response = await fetch('/api/virtual-hub/ministry-types');
      if (response.ok) {
        const data = await response.json();
        setMinistryTypes(data.ministryTypes || []);
      }
    } catch (error) {
      console.error('Error fetching ministry types:', error);
    }
  };

  const onSubmit = async (data: TeamMemberFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/team-members/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team member');
      }

      const result = await response.json();

      // Show success message
      alert(
        `Team member created successfully!${
          result.temporaryPassword
            ? `\n\nTemporary password: ${result.temporaryPassword}\n\nPlease save this password and share it securely with the team member.`
            : ''
        }`
      );

      // Redirect to team members list
      router.push('/admin/team-members');
    } catch (err) {
      console.error('Error creating team member:', err);
      setError(err instanceof Error ? err.message : 'Failed to create team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/admin/team-members" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Add Team Member</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  id="firstName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  id="lastName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="mt-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio (Optional)
              </label>
              <textarea
                {...register('bio')}
                id="bio"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Brief description about the team member..."
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Role & Ministry Types</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative flex items-start p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50">
                  <input
                    {...register('role')}
                    type="radio"
                    value="staff"
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Staff Member</div>
                    <p className="text-sm text-gray-600 mt-1">For paid ministry sessions</p>
                  </div>
                </label>

                <label className="relative flex items-start p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50">
                  <input
                    {...register('role')}
                    type="radio"
                    value="volunteer"
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Volunteer</div>
                    <p className="text-sm text-gray-600 mt-1">For free queue sessions</p>
                  </div>
                </label>
              </div>
              {errors.role && <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ministry Types <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-4">
                {ministryTypes.map((type) => (
                  <label key={type._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      {...register('ministryTypes')}
                      type="checkbox"
                      value={type._id}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-700">{type.title}</span>
                  </label>
                ))}
              </div>
              {errors.ministryTypes && (
                <p className="mt-2 text-sm text-red-600">{errors.ministryTypes.message}</p>
              )}
            </div>
          </div>

          {/* Portal Access */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Portal Access</h2>
            <label className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                {...register('createPortalAccess')}
                type="checkbox"
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Create Team Member Portal Account</div>
                <p className="text-sm text-gray-600 mt-1">
                  Allow this team member to log in, manage availability, and view sessions
                </p>
              </div>
            </label>

            {createPortalAccess && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 font-medium mb-2">Portal Account Setup</p>
                    <p className="text-sm text-blue-800">
                      A temporary password will be generated automatically. The team member will receive an email with instructions to log in and can reset their password at any time.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/team-members"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Team Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateTeamMemberPage() {
  return (
    <AdminGuard>
      <CreateTeamMemberContent />
    </AdminGuard>
  );
}
