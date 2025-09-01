import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin-session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export interface AdminUser {
  username: string
  isAuthenticated: boolean
}

// Verify admin credentials
export function verifyAdminCredentials(username: string, password: string): boolean {
  const adminUser = process.env.ADMIN_USER
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminUser || !adminPassword) {
    console.error('Admin credentials not configured in environment variables')
    return false
  }

  return username === adminUser && password === adminPassword
}

// Create admin session token (simple base64 encoding with timestamp)
export function createAdminSession(username: string): string {
  const sessionData = {
    username,
    timestamp: Date.now(),
    expires: Date.now() + SESSION_DURATION,
  }
  
  return Buffer.from(JSON.stringify(sessionData)).toString('base64')
}

// Verify admin session token
export function verifyAdminSession(token: string): AdminUser | null {
  try {
    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    
    if (!sessionData.username || !sessionData.expires) {
      return null
    }
    
    // Check if session has expired
    if (Date.now() > sessionData.expires) {
      return null
    }
    
    // Verify the username matches our admin user
    if (sessionData.username !== process.env.ADMIN_USER) {
      return null
    }
    
    return {
      username: sessionData.username,
      isAuthenticated: true,
    }
  } catch (error) {
    console.error('Invalid session token:', error)
    return null
  }
}

// Get current admin session from cookies
export async function getCurrentAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  
  if (!sessionToken) {
    return null
  }
  
  return verifyAdminSession(sessionToken)
}

// Check if current request is from authenticated admin
export async function isAdminAuthenticated(request?: NextRequest): Promise<boolean> {
  try {
    if (request) {
      // For API routes - check cookie from request
      const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
      if (!sessionToken) return false
      
      const session = verifyAdminSession(sessionToken)
      return session?.isAuthenticated ?? false
    } else {
      // For React components - use Next.js cookies()
      const session = await getCurrentAdminSession()
      return session?.isAuthenticated ?? false
    }
  } catch (error) {
    console.error('Error checking admin authentication:', error)
    return false
  }
}

// Admin session management constants
export const ADMIN_COOKIE_OPTIONS = {
  name: ADMIN_SESSION_COOKIE,
  maxAge: SESSION_DURATION / 1000, // Convert to seconds
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/', // Make cookie available for all paths
}
