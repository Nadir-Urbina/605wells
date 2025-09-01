import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_OPTIONS } from '@/lib/auth'

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    // Clear the admin session cookie
    response.cookies.set(ADMIN_COOKIE_OPTIONS.name, '', {
      maxAge: 0,
      httpOnly: ADMIN_COOKIE_OPTIONS.httpOnly,
      secure: ADMIN_COOKIE_OPTIONS.secure,
      sameSite: ADMIN_COOKIE_OPTIONS.sameSite,
      path: ADMIN_COOKIE_OPTIONS.path,
    })

    console.log('Admin logout successful')
    return response

  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
