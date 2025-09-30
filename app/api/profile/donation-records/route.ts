import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { getDonationRecordsByUser, createDonationRecord } from '@/lib/db/donation-records';
import { updateUserLastDonationDate } from '@/lib/db/users';
import { ObjectId } from 'mongodb';

// GET - Get user's donation records
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

    // Get user details
    const user = await findUserById(payload.sub);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user ID from query params if provided (for admin access)
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');
    const targetUserId = userIdParam ? new ObjectId(userIdParam) : new ObjectId(user._id);

    // Get donation records
    const records = await getDonationRecordsByUser(targetUserId);

    // Format records for response
    const formattedRecords = records.map(record => ({
      _id: record._id?.toString(),
      donation_date: record.donation_date,
      blood_group: record.blood_group,
      bags_donated: record.bags_donated,
      donation_place: record.donation_place,
      emergency_serial_number: record.emergency_serial_number,
      created_at: record.created_at
    }));

    return NextResponse.json({
      success: true,
      records: formattedRecords
    });

  } catch (error) {
    console.error('Get donation records error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new donation record
export async function POST(request: NextRequest) {
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

    // Get user details
    const user = await findUserById(payload.sub);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      donation_date,
      blood_group,
      bags_donated = 1,
      donation_place
    } = body;

    // Validate required fields
    if (!donation_date || !blood_group) {
      return NextResponse.json(
        { error: 'Donation date and blood group are required' },
        { status: 400 }
      );
    }

    // Validate donation date
    const donationDate = new Date(donation_date);
    if (isNaN(donationDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid donation date format' },
        { status: 400 }
      );
    }

    // Validate blood group
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(blood_group)) {
      return NextResponse.json(
        { error: 'Invalid blood group' },
        { status: 400 }
      );
    }

    // Validate bags donated
    if (bags_donated < 1 || bags_donated > 5) {
      return NextResponse.json(
        { error: 'Bags donated must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Create donation record
    const donationRecord = await createDonationRecord({
      donor_id: new ObjectId(user._id),
      donation_date: donationDate,
      blood_group: blood_group,
      bags_donated: bags_donated,
      donation_place: donation_place || null
    });

    // Update user's last donation date if this is the most recent donation
    if (!user.last_donation_date || donationDate > new Date(user.last_donation_date)) {
      await updateUserLastDonationDate(new ObjectId(user._id), donationDate);
    }

    return NextResponse.json({
      success: true,
      message: 'Donation record created successfully',
      record: {
        _id: donationRecord._id?.toString(),
        donation_date: donationRecord.donation_date,
        blood_group: donationRecord.blood_group,
        bags_donated: donationRecord.bags_donated,
        donation_place: donationRecord.donation_place,
        created_at: donationRecord.created_at
      }
    });

  } catch (error) {
    console.error('Create donation record error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
