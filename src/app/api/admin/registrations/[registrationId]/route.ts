import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { writeClient } from '@/lib/sanity'

interface Props {
  params: Promise<{ registrationId: string }>
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    // Check admin authentication
    const isAuthenticated = await isAdminAuthenticated(request)
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { registrationId } = await params
    const body = await request.json()
    const { status, notes } = body

    // Validate status if provided
    const validStatuses = ['confirmed', 'cancelled', 'no-show', 'checked-in']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, string> = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update the registration
    const updatedRegistration = await writeClient
      .patch(registrationId)
      .set(updateData)
      .commit()

    console.log('Updated registration:', registrationId, updateData)

    return NextResponse.json({
      success: true,
      registration: updatedRegistration
    })

  } catch (error) {
    console.error('Error updating registration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
