// Get family members grouped by blood group API route
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { getAccessibleRelatives } from '@/lib/db/relatives';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get current user
    const currentUser = await findUserById(payload.sub);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all accessible relatives
    const relatives = await getAccessibleRelatives(new ObjectId(currentUser._id));
    
    // Get user details for each relative
    const familyMembers = await Promise.all(
      relatives.map(async (relative) => {
        if (!relative.relative_user_id) {
          return null; // Skip if relative not yet registered
        }

        const relativeUser = await findUserById(relative.relative_user_id.toString());
        if (!relativeUser) {
          return null;
        }

        return {
          id: relative._id?.toString(),
          user_code: relativeUser.user_code,
          name: relativeUser.name || 'Unknown',
          blood_group: relativeUser.blood_group_public || 'Unknown',
          location: relativeUser.location_address || 'Unknown',
          phone: relativeUser.phone || 'Not provided',
          relation: relative.relation,
          last_donation_date: relative.last_donation_date,
          time_availability: relative.time_availability,
          is_available: isAvailableForDonation(relative.last_donation_date),
          created_at: relative.created_at
        };
      })
    );

    // Filter out null values and group by blood group
    const validFamilyMembers = familyMembers.filter(Boolean);
    
    const bloodGroupMap: Record<string, any[]> = {};
    
    // Initialize all blood groups
    BLOOD_GROUPS.forEach(bg => {
      bloodGroupMap[bg] = [];
    });

    // Group family members by blood group
    validFamilyMembers.forEach(member => {
      if (member && bloodGroupMap[member.blood_group]) {
        bloodGroupMap[member.blood_group].push(member);
      }
    });

    // Convert to array format for grid display
    const bloodGroupData = BLOOD_GROUPS.map(bloodGroup => ({
      blood_group: bloodGroup,
      members: bloodGroupMap[bloodGroup],
      count: bloodGroupMap[bloodGroup].length
    }));

    return NextResponse.json({
      success: true,
      blood_groups: bloodGroupData,
      total_family_members: validFamilyMembers.length
    });

  } catch (error) {
    console.error('Get family blood groups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if family member is available for donation
 */
function isAvailableForDonation(lastDonationDate?: Date): boolean {
  if (!lastDonationDate) {
    return true; // Never donated, available
  }

  const now = new Date();
  const daysSinceLastDonation = Math.floor(
    (now.getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceLastDonation >= 56; // Standard blood donation interval
}
