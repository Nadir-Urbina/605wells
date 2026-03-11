'use client';

import { useState } from 'react';
import SessionTypeSelector from './SessionTypeSelector';
import TeamMemberSelector from './TeamMemberSelector';
import FreeQueueForm from './FreeQueueForm';
import CalendarView from './CalendarView';
import MinistrySessionPaymentForm from '../forms/MinistrySessionPaymentForm';

interface MinistryType {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  averageDuration: number;
  costType: 'free' | 'paid' | 'both';
  price?: number;
  intakeFormQuestions?: Array<{
    question: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect';
    required: boolean;
    options?: string[];
    placeholder?: string;
  }>;
}

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: {
    asset: {
      url: string;
    };
  };
  bio?: string;
  role: 'staff' | 'volunteer';
}

interface SessionRequestFlowProps {
  ministryType: MinistryType;
  teamMembers: TeamMember[];
}

type SessionType = 'paid' | 'free' | null;

export default function SessionRequestFlow({
  ministryType,
  teamMembers,
}: SessionRequestFlowProps) {
  const [step, setStep] = useState(1);
  const [sessionType, setSessionType] = useState<SessionType>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);

  const handleSessionTypeSelect = (type: SessionType) => {
    setSessionType(type);
    setStep(2);
  };

  const handleTeamMemberSelect = (teamMemberId: string) => {
    setSelectedTeamMember(teamMemberId);
    setStep(3);
  };

  const handleSlotSelect = (date: string, timeSlot: { startTime: string; endTime: string; available: boolean; bookingId?: string }) => {
    setSelectedSlot({
      date,
      time: timeSlot.startTime,
    });
    setStep(4); // Move to payment step
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSessionType(null);
    } else if (step === 3) {
      setStep(2);
      setSelectedTeamMember(null);
    } else if (step === 4) {
      setStep(3);
      setSelectedSlot(null);
    }
  };

  // Filter team members by session type
  const filteredTeamMembers = teamMembers.filter((member) => {
    if (sessionType === 'paid') {
      return member.role === 'staff';
    } else if (sessionType === 'free') {
      return member.role === 'volunteer';
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step >= 1 ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
              }`}
            >
              {step > 1 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                '1'
              )}
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:block">Choose Type</span>
          </div>

          <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`} />

          <div className={`flex items-center ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step >= 2 ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
              }`}
            >
              {step > 2 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                '2'
              )}
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:block">
              {sessionType === 'paid' ? 'Select Team Member' : 'Submit Request'}
            </span>
          </div>

          {sessionType === 'paid' && (
            <>
              <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-300'}`} />

              <div className={`flex items-center ${step >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step >= 3 ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'
                  }`}
                >
                  {step > 3 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    '3'
                  )}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">Select Time</span>
              </div>

              <div className={`flex-1 h-0.5 mx-4 ${step >= 4 ? 'bg-purple-600' : 'bg-gray-300'}`} />

              <div className={`flex items-center ${step >= 4 ? 'text-purple-600' : 'text-gray-400'}`}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step >= 4 ? 'border-purple-600' : 'border-gray-300'
                  }`}
                >
                  4
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">Payment</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <SessionTypeSelector
            ministryType={ministryType}
            onSelect={handleSessionTypeSelect}
          />
        )}

        {step === 2 && sessionType === 'paid' && (
          <>
            <button
              onClick={handleBack}
              className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <TeamMemberSelector
              teamMembers={filteredTeamMembers}
              onSelect={handleTeamMemberSelect}
            />
          </>
        )}

        {step === 2 && sessionType === 'free' && (
          <>
            <button
              onClick={handleBack}
              className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <FreeQueueForm
              ministryType={ministryType}
            />
          </>
        )}

        {step === 3 && sessionType === 'paid' && selectedTeamMember && (
          <>
            <button
              onClick={handleBack}
              className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <CalendarView
              teamMemberId={selectedTeamMember}
              ministryTypeId={ministryType._id}
              duration={ministryType.averageDuration}
              onSlotSelect={handleSlotSelect}
            />
          </>
        )}

        {step === 4 && sessionType === 'paid' && selectedTeamMember && selectedSlot && (
          <>
            <button
              onClick={handleBack}
              className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <MinistrySessionPaymentForm
              ministryType={ministryType}
              teamMemberId={selectedTeamMember}
              selectedSlot={selectedSlot}
            />
          </>
        )}
      </div>
    </div>
  );
}
