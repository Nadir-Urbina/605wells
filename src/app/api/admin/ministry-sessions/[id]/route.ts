import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { isAdminAuthenticated } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const isAuthenticated = await isAdminAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, scheduledDate, notes } = body;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;
    if (notes !== undefined) updateData.notes = notes;

    // Update the session request in Sanity
    const updatedRequest = await client
      .patch(id)
      .set(updateData)
      .commit();

    console.log('✅ Ministry session request updated:', id);

    return NextResponse.json({
      message: 'Session request updated successfully',
      sessionRequest: updatedRequest
    });

  } catch (error) {
    console.error('Error updating ministry session request:', error);
    return NextResponse.json(
      { error: 'Failed to update session request' },
      { status: 500 }
    );
  }
}
