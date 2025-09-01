import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated, getCurrentAdminSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check if admin credentials are configured
    if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
      console.error('Admin credentials not configured in environment variables')
      return NextResponse.json(
        { error: 'Admin system not configured', isAuthenticated: false, user: null },
        { status: 500 }
      )
    }

    const isAuthenticated = await isAdminAuthenticated(request)
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { isAuthenticated: false, user: null },
        { status: 401 }
      )
    }

    const session = await getCurrentAdminSession()
    
    return NextResponse.json({
      isAuthenticated: true,
      user: session
    })

  } catch (error) {
    console.error('Admin verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', isAuthenticated: false, user: null },
      { status: 500 }
    )
  }
}
