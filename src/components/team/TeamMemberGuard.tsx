'use client';

import { TeamMemberProvider, useTeamMember } from '@/contexts/TeamMemberContext';

interface TeamMemberGuardProps {
  children: React.ReactNode;
}

function GuardContent({ children }: TeamMemberGuardProps) {
  const { isLoading, user } = useTeamMember();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

export default function TeamMemberGuard({ children }: TeamMemberGuardProps) {
  return (
    <TeamMemberProvider>
      <GuardContent>{children}</GuardContent>
    </TeamMemberProvider>
  );
}
