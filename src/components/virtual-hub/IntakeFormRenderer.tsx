'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface IntakeQuestion {
  question: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface IntakeFormRendererProps {
  questions: IntakeQuestion[];
  bookingId: string;
  onSuccess?: () => void;
}

// Dynamic schema builder based on questions
function buildSchema(questions: IntakeQuestion[]) {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  questions.forEach((question, index) => {
    const fieldKey = `question_${index}`;

    switch (question.type) {
      case 'text':
        schemaFields[fieldKey] = question.required
          ? z.string().min(1, `${question.question} is required`)
          : z.string().optional();
        break;

      case 'textarea':
        schemaFields[fieldKey] = question.required
          ? z.string().min(10, `Please provide at least 10 characters`)
          : z.string().optional();
        break;

      case 'select':
        schemaFields[fieldKey] = question.required
          ? z.string().min(1, 'Please select an option')
          : z.string().optional();
        break;

      case 'multiselect':
        schemaFields[fieldKey] = question.required
          ? z.array(z.string()).min(1, 'Please select at least one option')
          : z.array(z.string()).optional();
        break;
    }
  });

  return z.object(schemaFields);
}

export default function IntakeFormRenderer({
  questions,
  bookingId,
  onSuccess,
}: IntakeFormRendererProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = buildSchema(questions);
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Transform form data into question-answer pairs
      const responses: Record<string, unknown> = {};
      questions.forEach((question, index) => {
        const fieldKey = `question_${index}`;
        responses[question.question] = data[fieldKey as keyof FormData];
      });

      // Submit intake form
      const response = await fetch('/api/virtual-hub/submit-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          responses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit intake form');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting intake form:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit intake form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">No intake questions are configured for this ministry type.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {questions.map((question, index) => {
        const fieldKey = `question_${index}` as keyof FormData;
        const fieldError = errors[fieldKey];

        return (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {/* Text Input */}
            {question.type === 'text' && (
              <input
                {...register(fieldKey)}
                type="text"
                placeholder={question.placeholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            )}

            {/* Textarea */}
            {question.type === 'textarea' && (
              <textarea
                {...register(fieldKey)}
                rows={4}
                placeholder={question.placeholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            )}

            {/* Select Dropdown */}
            {question.type === 'select' && question.options && (
              <select
                {...register(fieldKey)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Select an option --</option>
                {question.options.map((option, optionIndex) => (
                  <option key={optionIndex} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* Multiselect Checkboxes */}
            {question.type === 'multiselect' && question.options && (
              <Controller
                name={fieldKey}
                control={control}
                defaultValue={[] as string[]}
                render={({ field }) => (
                  <div className="space-y-2">
                    {question.options!.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={option}
                          checked={(field.value as string[])?.includes(option) || false}
                          onChange={(e) => {
                            const currentValue = (field.value as string[]) || [];
                            if (e.target.checked) {
                              field.onChange([...currentValue, option]);
                            } else {
                              field.onChange(
                                currentValue.filter((v: string) => v !== option)
                              );
                            }
                          }}
                          className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
            )}

            {/* Error Message */}
            {fieldError && (
              <p className="text-sm text-red-600">
                {fieldError.message as string}
              </p>
            )}
          </div>
        );
      })}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Intake Form'}
        </button>
      </div>
    </form>
  );
}
