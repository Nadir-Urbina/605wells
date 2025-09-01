'use client'

import { useState, useEffect } from 'react'
import { AdminUser } from '@/lib/auth'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const verifyAuthentication = async () => {
    try {
      const response = await fetch('/api/admin/verify')
      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth verification error:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    verifyAuthentication()
  }, [])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
            <p className="mt-4 text-center text-sm text-gray-600">
              Verifying authentication...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <p className="text-center text-sm text-gray-600">
              Access denied. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Render protected content
  return <>{children}</>
}

// Hook to use admin user data in components
export function useAdminUser() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch('/api/admin/verify')
        const data = await response.json()
        
        if (response.ok && data.isAuthenticated) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error getting admin user:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  return { user, isLoading }
}
