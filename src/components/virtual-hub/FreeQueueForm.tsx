'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const freeQueueSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  preferredDays: z.array(z.string()).min(1, 'Please select at least one day'),
  preferredTimes: z.array(z.string()).min(1, 'Please select at least one time'),
  requestMessage: z.string().optional(),
});

type FreeQueueFormData = z.infer<typeof freeQueueSchema>;

interface MinistryType {
  _id: string;
  title: string;
  slug: { current: string };
}

interface FreeQueueFormProps {
  ministryType: MinistryType;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_PREFERENCES = ['Morning', 'Afternoon', 'Evening'];

export default function FreeQueueForm({ ministryType }: FreeQueueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FreeQueueFormData>({
    resolver: zodResolver(freeQueueSchema),
    defaultValues: {
      preferredDays: [],
      preferredTimes: [],
    },
  });

  const selectedDays = watch('preferredDays') || [];
  const selectedTimes = watch('preferredTimes') || [];

  const onSubmit = async (data: FreeQueueFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/virtual-hub/join-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ministryType: ministryType._id,
          ministryTypeTitle: ministryType.title,
          attendeeInfo: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
          },
          preferredDays: data.preferredDays,
          preferredTimes: data.preferredTimes,
          requestMessage: data.requestMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting queue request:', error);
      alert('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;ve Been Added to the Queue!
        </h3>
        <p className="text-gray-600 mb-6">
          Thank you for your request. You&apos;ll receive an email confirmation shortly, and our admin team will schedule your session based on availability.
        </p>
        <a
          href="/virtual-hub"
          className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          Return to Virtual Hub
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Free Queue</h2>
      <p className="text-gray-600 mb-8">
        Fill out the form below and we&apos;ll schedule your session with one of our volunteer team members.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone (Optional)
            </label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Preferred Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Days <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DAYS_OF_WEEK.map((day) => (
              <label
                key={day}
                className={`flex items-center justify-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedDays.includes(day)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  {...register('preferredDays')}
                  type="checkbox"
                  value={day}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{day}</span>
              </label>
            ))}
          </div>
          {errors.preferredDays && (
            <p className="mt-1 text-sm text-red-600">{errors.preferredDays.message}</p>
          )}
        </div>

        {/* Preferred Times */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Times <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {TIME_PREFERENCES.map((time) => (
              <label
                key={time}
                className={`flex items-center justify-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTimes.includes(time)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  {...register('preferredTimes')}
                  type="checkbox"
                  value={time}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{time}</span>
              </label>
            ))}
          </div>
          {errors.preferredTimes && (
            <p className="mt-1 text-sm text-red-600">{errors.preferredTimes.message}</p>
          )}
        </div>

        {/* Request Message */}
        <div>
          <label htmlFor="requestMessage" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            {...register('requestMessage')}
            id="requestMessage"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Let us know if you have any specific requests or concerns..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Join Free Queue'}
          </button>
        </div>
      </form>
    </div>
  );
}
