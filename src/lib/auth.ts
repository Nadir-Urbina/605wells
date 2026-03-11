import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getTeamMemberAuth } from './firestore'

const ADMIN_SESSION_COOKIE = 'admin-session'
const TEAM_MEMBER_SESSION_COOKIE = 'team-member-session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export interface AdminUser {
  username: string
  isAuthenticated: boolean
}

export interface TeamMemberUser {
  firebaseUid: string
  sanityTeamMemberId: string
  email: string
  role: 'team-member'
  isAuthenticated: boolean
}

export type AuthenticatedUser = AdminUser | TeamMemberUser

export function isTeamMemberUser(user: AuthenticatedUser): user is TeamMemberUser {
  return 'role' in user && user.role === 'team-member'
}

export function isAdminUser(user: AuthenticatedUser): user is AdminUser {
  return 'username' in user
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

// Team Member Authentication (Firebase Auth based)

// Create team member session token
export function createTeamMemberSession(
  firebaseUid: string,
  sanityTeamMemberId: string,
  email: string
): string {
  const sessionData = {
    firebaseUid,
    sanityTeamMemberId,
    email,
    role: 'team-member' as const,
    timestamp: Date.now(),
    expires: Date.now() + SESSION_DURATION,
  }

  return Buffer.from(JSON.stringify(sessionData)).toString('base64')
}

// Verify team member session token
export function verifyTeamMemberSession(token: string): TeamMemberUser | null {
  try {
    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))

    if (!sessionData.firebaseUid || !sessionData.expires || sessionData.role !== 'team-member') {
      return null
    }

    if (Date.now() > sessionData.expires) {
      return null
    }

    return {
      firebaseUid: sessionData.firebaseUid,
      sanityTeamMemberId: sessionData.sanityTeamMemberId,
      email: sessionData.email,
      role: 'team-member',
      isAuthenticated: true,
    }
  } catch (error) {
    console.error('Invalid team member session token:', error)
    return null
  }
}

// Get current team member session from cookies
export async function getCurrentTeamMemberSession(): Promise<TeamMemberUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(TEAM_MEMBER_SESSION_COOKIE)?.value

  if (!sessionToken) {
    return null
  }

  return verifyTeamMemberSession(sessionToken)
}

// Check if current request is from authenticated team member
export async function isTeamMemberAuthenticated(request?: NextRequest): Promise<boolean> {
  try {
    if (request) {
      const sessionToken = request.cookies.get(TEAM_MEMBER_SESSION_COOKIE)?.value
      if (!sessionToken) return false

      const session = verifyTeamMemberSession(sessionToken)
      return session?.isAuthenticated ?? false
    } else {
      const session = await getCurrentTeamMemberSession()
      return session?.isAuthenticated ?? false
    }
  } catch (error) {
    console.error('Error checking team member authentication:', error)
    return false
  }
}

// Team member session management constants
export const TEAM_MEMBER_COOKIE_OPTIONS = {
  name: TEAM_MEMBER_SESSION_COOKIE,
  maxAge: SESSION_DURATION / 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
}

// Get current user (admin or team member)
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const adminSession = await getCurrentAdminSession()
  if (adminSession) {
    return adminSession
  }

  const teamMemberSession = await getCurrentTeamMemberSession()
  if (teamMemberSession) {
    return teamMemberSession
  }

  return null
}
