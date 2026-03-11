'use client'

import { useState, useEffect } from 'react'
import { TeamMemberUser } from '@/lib/auth'

interface TeamMemberGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function TeamMemberGuard({ children, fallback }: TeamMemberGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const verifyAuthentication = async () => {
    try {
      const response = await fetch('/api/team/verify')
      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Team member auth verification error:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    verifyAuthentication()
  }, [])

  useEffect(() => {
    if (isAuthenticated === false) {
      window.location.href = '/team/login'
    }
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
            <p className="mt-4 text-center text-sm text-gray-600">
              Verifying team member authentication...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <p className="text-center text-sm text-gray-600">
              Access denied. Redirecting to team member login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function useTeamMember() {
  const [teamMember, setTeamMember] = useState<TeamMemberUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getTeamMember = async () => {
      try {
        const response = await fetch('/api/team/verify')
        const data = await response.json()

        if (response.ok && data.isAuthenticated) {
          setTeamMember(data.user)
        } else {
          setTeamMember(null)
        }
      } catch (error) {
        console.error('Error getting team member user:', error)
        setTeamMember(null)
      } finally {
        setIsLoading(false)
      }
    }

    getTeamMember()
  }, [])

  return { teamMember, isLoading }
}
