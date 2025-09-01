import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials, createAdminSession, ADMIN_COOKIE_OPTIONS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Verify credentials
    const isValid = verifyAdminCredentials(username, password)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session token
    const sessionToken = createAdminSession(username)
    
    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { username, isAuthenticated: true }
    })

    // Set secure HTTP-only cookie
    response.cookies.set(ADMIN_COOKIE_OPTIONS.name, sessionToken, {
      maxAge: ADMIN_COOKIE_OPTIONS.maxAge,
      httpOnly: ADMIN_COOKIE_OPTIONS.httpOnly,
      secure: ADMIN_COOKIE_OPTIONS.secure,
      sameSite: ADMIN_COOKIE_OPTIONS.sameSite,
      path: ADMIN_COOKIE_OPTIONS.path,
    })

    console.log('Admin login successful for:', username)
    return response

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
