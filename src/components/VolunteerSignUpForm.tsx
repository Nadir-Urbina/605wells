'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

// Individual ministry area availability schema
const ministryAvailabilitySchema = z.object({
  ministryArea: z.string(),
  daysOfWeek: z.array(z.string()).min(1, 'Please select at least one day'),
  frequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'occasionally']),
  timePreferences: z.array(z.string()).min(1, 'Please select at least one time preference'),
});

// Form validation schema for volunteer sign-up
const volunteerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  ministryAvailabilities: z.array(ministryAvailabilitySchema).min(1, 'Please configure at least one ministry area'),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;
type MinistryAvailability = z.infer<typeof ministryAvailabilitySchema>;

const MINISTRY_AREAS = [
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'child-care', label: 'Child Care', icon: '👶' },
  { value: 'cooking', label: 'Cooking/Kitchen', icon: '👨‍🍳' },
  { value: 'prayer-meetings', label: 'Prayer/Intercession', icon: '🙏' },
  { value: 'preaching-teaching', label: 'Preaching/Teaching', icon: '📖' },
  { value: 'lawn-care', label: 'Lawn Care', icon: '🌱' },
  { value: 'building-maintenance', label: 'Building Maintenance', icon: '🔧' },
  { value: 'media', label: 'Media', icon: '🎥' },
  { value: 'worship-team', label: 'Worship Team', icon: '🎵' },
  { value: 'deliverance-inner-healing', label: 'Deliverance & Inner Healing', icon: '✨' },
  { value: 'events-coordination', label: 'Events Coordination', icon: '📅' },
  { value: 'decoration', label: 'Decoration', icon: '🎨' },
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Every Week' },
  { value: 'bi-weekly', label: 'Every Two Weeks' },
  { value: 'monthly', label: 'Once a Month' },
  { value: 'occasionally', label: 'Occasionally' },
];

const TIME_PREFERENCES = [
  { value: 'morning', label: 'Morning', time: '6am - 12pm' },
  { value: 'afternoon', label: 'Afternoon', time: '12pm - 6pm' },
  { value: 'evening', label: 'Evening', time: '6pm - 10pm' },
];

export default function VolunteerSignUpForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [expandedMinistry, setExpandedMinistry] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      ministryAvailabilities: [],
    },
  });

  const ministryAvailabilities = watch('ministryAvailabilities') || [];

  const toggleMinistry = (ministryValue: string) => {
    const existingIndex = ministryAvailabilities.findIndex(
      (m) => m.ministryArea === ministryValue
    );

    if (existingIndex >= 0) {
      // Remove this ministry
      const updated = ministryAvailabilities.filter((_, i) => i !== existingIndex);
      setValue('ministryAvailabilities', updated);
      if (expandedMinistry === ministryValue) {
        setExpandedMinistry(null);
      }
    } else {
      // Add this ministry with default values
      const newMinistry: MinistryAvailability = {
        ministryArea: ministryValue,
        daysOfWeek: [],
        frequency: 'weekly',
        timePreferences: [],
      };
      setValue('ministryAvailabilities', [...ministryAvailabilities, newMinistry]);
      setExpandedMinistry(ministryValue);
    }
  };

  const updateMinistryField = <K extends keyof MinistryAvailability>(
    ministryValue: string,
    field: K,
    value: MinistryAvailability[K]
  ) => {
    const updated = ministryAvailabilities.map((m) =>
      m.ministryArea === ministryValue ? { ...m, [field]: value } : m
    );
    setValue('ministryAvailabilities', updated);
  };

  const getMinistryData = (ministryValue: string): MinistryAvailability | undefined => {
    return ministryAvailabilities.find((m) => m.ministryArea === ministryValue);
  };

  const isMinistrySelected = (ministryValue: string) => {
    return ministryAvailabilities.some((m) => m.ministryArea === ministryValue);
  };

  const isMinistryComplete = (ministryValue: string) => {
    const data = getMinistryData(ministryValue);
    return data && data.daysOfWeek.length > 0 && data.timePreferences.length > 0;
  };

  const onSubmit = async (data: VolunteerFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Transform data to match API expectations
      const transformedData = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        ministryAvailabilities: data.ministryAvailabilities,
      };

      const response = await fetch('/api/volunteers/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      // Show success state
      setIsSuccess(true);

      // Reset form after 5 seconds
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
      <div className="max-w-4xl mx-auto">
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 pb-2 border-b-2 border-purple-200">
                      Ministry Areas & Availability
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Select ministry areas and configure your availability for each one
                    </p>

                    <div className="space-y-3">
                      {MINISTRY_AREAS.map((area) => {
                        const isSelected = isMinistrySelected(area.value);
                        const isComplete = isMinistryComplete(area.value);
                        const isExpanded = expandedMinistry === area.value;
                        const ministryData = getMinistryData(area.value);

                        return (
                          <div
                            key={area.value}
                            className={`border-2 rounded-lg transition-all ${
                              isSelected && !isComplete
                                ? 'border-amber-500 bg-amber-50'
                                : isSelected
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            {/* Ministry Header */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setExpandedMinistry(isExpanded ? null : area.value);
                                } else {
                                  toggleMinistry(area.value);
                                }
                              }}
                              className="w-full p-4 flex items-center justify-between text-left"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="text-2xl">{area.icon}</div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{area.label}</div>
                                  {isSelected && ministryData && (
                                    <div className="text-xs mt-0.5">
                                      {isComplete ? (
                                        <span className="text-gray-600">
                                          {ministryData.daysOfWeek.length} day{ministryData.daysOfWeek.length !== 1 ? 's' : ''} • {ministryData.frequency}
                                        </span>
                                      ) : (
                                        <span className="text-amber-600 font-medium flex items-center gap-1">
                                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                          Selection incomplete
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isSelected && isComplete && (
                                  <div className="bg-green-100 rounded-full p-1">
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                                {isSelected && !isComplete && (
                                  <div className="bg-amber-100 rounded-full p-1">
                                    <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                                {isSelected ? (
                                  <svg
                                    className={`w-5 h-5 ${isComplete ? 'text-purple-600' : 'text-amber-600'} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                )}
                              </div>
                            </button>

                            {/* Expanded Availability Configuration */}
                            <AnimatePresence>
                              {isSelected && isExpanded && ministryData && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 space-y-4 border-t border-purple-200 pt-4">
                                    {/* Days of Week */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Available Days *
                                      </label>
                                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                        {DAYS_OF_WEEK.map((day) => (
                                          <label
                                            key={day.value}
                                            className={`flex items-center justify-center p-2 border-2 rounded-lg cursor-pointer transition-all text-sm ${
                                              ministryData.daysOfWeek.includes(day.value)
                                                ? 'border-purple-500 bg-purple-100 text-purple-900 font-medium'
                                                : 'border-gray-200 hover:border-purple-300'
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={ministryData.daysOfWeek.includes(day.value)}
                                              onChange={(e) => {
                                                const updated = e.target.checked
                                                  ? [...ministryData.daysOfWeek, day.value]
                                                  : ministryData.daysOfWeek.filter((d) => d !== day.value);
                                                updateMinistryField(area.value, 'daysOfWeek', updated);
                                              }}
                                              className="sr-only"
                                            />
                                            {day.label}
                                          </label>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Frequency */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Frequency *
                                      </label>
                                      <select
                                        value={ministryData.frequency}
                                        onChange={(e) => updateMinistryField(area.value, 'frequency', e.target.value as 'weekly' | 'bi-weekly' | 'monthly' | 'occasionally')}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                      >
                                        {FREQUENCY_OPTIONS.map((freq) => (
                                          <option key={freq.value} value={freq.value}>
                                            {freq.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Time Preferences */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Time Preferences *
                                      </label>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {TIME_PREFERENCES.map((time) => (
                                          <label
                                            key={time.value}
                                            className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                              ministryData.timePreferences.includes(time.value)
                                                ? 'border-purple-500 bg-purple-100'
                                                : 'border-gray-200 hover:border-purple-300'
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={ministryData.timePreferences.includes(time.value)}
                                              onChange={(e) => {
                                                const updated = e.target.checked
                                                  ? [...ministryData.timePreferences, time.value]
                                                  : ministryData.timePreferences.filter((t) => t !== time.value);
                                                updateMinistryField(area.value, 'timePreferences', updated);
                                              }}
                                              className="sr-only"
                                            />
                                            <span className="text-sm font-medium text-gray-900">{time.label}</span>
                                            <span className="text-xs text-gray-600 mt-0.5">{time.time}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                      type="button"
                                      onClick={() => toggleMinistry(area.value)}
                                      className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      Remove this ministry area
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>

                    {errors.ministryAvailabilities && (
                      <p className="text-red-500 text-sm mt-2">{errors.ministryAvailabilities.message}</p>
                    )}

                    {ministryAvailabilities.length > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>{ministryAvailabilities.length}</strong> ministry area{ministryAvailabilities.length !== 1 ? 's' : ''} selected.
                          {ministryAvailabilities.filter(m => m.daysOfWeek.length === 0 || m.timePreferences.length === 0).length > 0 && (
                            <span className="text-orange-600 ml-1">
                              Please complete all selections.
                            </span>
                          )}
                        </p>
                      </div>
                    )}
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
