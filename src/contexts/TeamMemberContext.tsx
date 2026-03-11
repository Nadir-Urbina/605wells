'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface TeamMemberContextType {
  user: User | null;
  sanityTeamMemberId: string | null;
  isLoading: boolean;
}

const TeamMemberContext = createContext<TeamMemberContextType>({
  user: null,
  sanityTeamMemberId: null,
  isLoading: true,
});

export function TeamMemberProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sanityTeamMemberId, setSanityTeamMemberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Verify session on the server to get Sanity team member ID
        try {
          const response = await fetch('/api/team/verify-session');
          if (response.ok) {
            const data = await response.json();
            setSanityTeamMemberId(data.teamMember.sanityTeamMemberId);
          } else {
            // Session invalid, redirect to login
            router.push('/team/login');
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          router.push('/team/login');
        }
      } else {
        // Not authenticated, redirect to login
        router.push('/team/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <TeamMemberContext.Provider value={{ user, sanityTeamMemberId, isLoading }}>
      {children}
    </TeamMemberContext.Provider>
  );
}

export function useTeamMember() {
  const context = useContext(TeamMemberContext);
  if (context === undefined) {
    throw new Error('useTeamMember must be used within a TeamMemberProvider');
  }
  return context;
}
