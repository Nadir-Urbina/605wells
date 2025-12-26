'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

// Form validation schema for volunteer sign-up
const volunteerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  ministryAreas: z.array(z.string()).min(1, 'Please select at least one ministry area'),
  daysOfWeek: z.array(z.string()).min(1, 'Please select at least one day'),
  frequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'occasionally']).refine((val) => val !== undefined, {
    message: 'Please select how often you can volunteer',
  }),
  timePreferences: z.array(z.string()).min(1, 'Please select at least one time preference'),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

const MINISTRY_AREAS = [
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'prayer-meetings', label: 'Prayer Meetings' },
  { value: 'preaching', label: 'Preaching' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'lawn-care', label: 'Lawn Care' },
  { value: 'building-maintenance', label: 'Building Maintenance' },
  { value: 'media', label: 'Media' },
  { value: 'worship-team', label: 'Worship Team' },
  { value: 'deliverance-inner-healing', label: 'Deliverance and Inner Healing' },
  { value: 'events-coordination', label: 'Events Coordination' },
  { value: 'decoration', label: 'Decoration' },
  { value: 'child-care', label: 'Child Care' },
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Every Week' },
  { value: 'bi-weekly', label: 'Every Two Weeks' },
  { value: 'monthly', label: 'Once a Month' },
  { value: 'occasionally', label: 'Occasionally' },
];

const TIME_PREFERENCES = [
  { value: 'morning', label: 'Morning (6am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 6pm)' },
  { value: 'evening', label: 'Evening (6pm - 10pm)' },
];

export default function VolunteerSignUpForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      ministryAreas: [],
      daysOfWeek: [],
      timePreferences: [],
    },
  });

  const selectedMinistryAreas = watch('ministryAreas') || [];
  const selectedDays = watch('daysOfWeek') || [];
  const selectedTimes = watch('timePreferences') || [];

  const onSubmit = async (data: VolunteerFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/volunteers/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      // Show success state
      setIsSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        reset();
        setIsSuccess(false);
      }, 5000);

    } catch (error) {
      console.error('Volunteer submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            /* Success State */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You for Volunteering!</h2>
              <p className="text-lg text-gray-600 mb-2">
                Your submission has been received successfully.
              </p>
              <p className="text-gray-600">
                Our team will review your information and reach out to you soon regarding volunteer opportunities.
              </p>
              <div className="mt-8">
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                >
                  Return to Home
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Volunteer Form */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
                <div className="relative z-10">
                  <h1 className="text-3xl sm:text-4xl font-bold font-montserrat mb-2">
                    Volunteer Sign-Up
                  </h1>
                  <p className="text-purple-100 text-lg">
                    Join our ministry team and make a difference in the Kingdom
                  </p>
                </div>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Personal Information Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-200">
                      Personal Information
                    </h2>

                    <div className="space-y-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          {...register('fullName')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter your full name"
                        />
                        {errors.fullName && (
                          <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                        )}
                      </div>

                      {/* Email and Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            {...register('email')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="your.email@example.com"
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            {...register('phone')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="(123) 456-7890"
                          />
                          {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ministry Areas Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-200">
                      Ministry Areas
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Select all areas where you would like to serve (choose at least one)
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {MINISTRY_AREAS.map((area) => (
                        <label
                          key={area.value}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedMinistryAreas.includes(area.value)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={area.value}
                            {...register('ministryAreas')}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {area.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.ministryAreas && (
                      <p className="text-red-500 text-sm mt-2">{errors.ministryAreas.message}</p>
                    )}
                  </div>

                  {/* Availability Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-200">
                      Availability
                    </h2>

                    {/* Days of Week */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Which days are you available? *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <label
                            key={day.value}
                            className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedDays.includes(day.value)
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              value={day.value}
                              {...register('daysOfWeek')}
                              className="sr-only"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {day.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.daysOfWeek && (
                        <p className="text-red-500 text-sm mt-2">{errors.daysOfWeek.message}</p>
                      )}
                    </div>

                    {/* Frequency */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        How often can you volunteer? *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {FREQUENCY_OPTIONS.map((freq) => (
                          <label
                            key={freq.value}
                            className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-purple-300"
                          >
                            <input
                              type="radio"
                              value={freq.value}
                              {...register('frequency')}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {freq.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.frequency && (
                        <p className="text-red-500 text-sm mt-2">{errors.frequency.message}</p>
                      )}
                    </div>

                    {/* Time Preferences */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        What times work best for you? *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {TIME_PREFERENCES.map((time) => (
                          <label
                            key={time.value}
                            className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedTimes.includes(time.value)
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              value={time.value}
                              {...register('timePreferences')}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {time.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.timePreferences && (
                        <p className="text-red-500 text-sm mt-2">{errors.timePreferences.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-red-800 text-sm">{submitError}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Volunteer Application'
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    By submitting this form, you agree to be contacted by our ministry team regarding volunteer opportunities.
                  </p>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
