'use client';

import Image from 'next/image';

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

interface TeamMemberSelectorProps {
  teamMembers: TeamMember[];
  onSelect: (teamMemberId: string) => void;
}

export default function TeamMemberSelector({
  teamMembers,
  onSelect,
}: TeamMemberSelectorProps) {
  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Team Members Available
        </h3>
        <p className="text-gray-600">
          There are currently no team members available for this ministry type.
          Please try again later or join the free queue.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Select a Team Member
      </h2>
      <p className="text-gray-600 mb-8">
        Choose who you&apos;d like to meet with, or select &quot;Any Available&quot; to be matched with the next available team member.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Any Available Option */}
        <button
          onClick={() => onSelect('any')}
          className="group flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all duration-200"
        >
          <div className="relative w-20 h-20 mb-3">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 text-center group-hover:text-purple-600">
            Any Available
          </h3>
          <p className="text-xs text-gray-500 text-center mt-1">
            Next available
          </p>
        </button>

        {/* Team Members */}
        {teamMembers.map((member) => (
          <button
            key={member._id}
            onClick={() => onSelect(member._id)}
            className="group flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all duration-200"
          >
            <div className="relative w-20 h-20 mb-3">
              {member.avatar?.asset?.url ? (
                <Image
                  src={member.avatar.asset.url}
                  alt={`${member.firstName} ${member.lastName}`}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-500">
                    {member.firstName[0]}
                    {member.lastName[0]}
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 text-center group-hover:text-purple-600">
              {member.firstName} {member.lastName}
            </h3>
            {member.bio && (
              <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2">
                {member.bio}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
