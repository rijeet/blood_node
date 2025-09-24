// Individual relative API route

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { 
  getRelativeById, 
  updateRelative, 
  deleteRelative,
  addDekWrapped,
  removeDekWrapped 
} from '@/lib/db/relatives';

// Get specific relative
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const relative = await getRelativeById(resolvedParams.id);
    
    if (!relative) {
      return NextResponse.json(
        { error: 'Relative not found' },
        { status: 404 }
      );
    }

    // Check if user has access (owner or has DEK wrapped entry)
    const hasAccess = relative.owner_user_code === user.user_code ||
      relative.dek_wrapped.some(wrapped => wrapped.recipient_user_code === user.user_code);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      relative
    });

  } catch (error) {
    console.error('Get relative error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update relative
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const resolvedParams = await params;
    const relative = await getRelativeById(resolvedParams.id);
    
    if (!relative) {
      return NextResponse.json(
        { error: 'Relative not found' },
        { status: 404 }
      );
    }

    // Only owner can update
    if (relative.owner_user_code !== user.user_code) {
      return NextResponse.json(
        { error: 'Only owner can update relative' },
        { status: 403 }
      );
    }

    // Update relative
    await updateRelative(resolvedParams.id, body);

    return NextResponse.json({
      success: true,
      message: 'Relative updated successfully'
    });

  } catch (error) {
    console.error('Update relative error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete relative
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const relative = await getRelativeById(resolvedParams.id);
    
    if (!relative) {
      return NextResponse.json(
        { error: 'Relative not found' },
        { status: 404 }
      );
    }

    // Only owner can delete
    if (relative.owner_user_code !== user.user_code) {
      return NextResponse.json(
        { error: 'Only owner can delete relative' },
        { status: 403 }
      );
    }

    await deleteRelative(resolvedParams.id, user.user_code);

    return NextResponse.json({
      success: true,
      message: 'Relative deleted successfully'
    });

  } catch (error) {
    console.error('Delete relative error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
