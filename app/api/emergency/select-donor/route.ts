import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { getEmergencyAlertById, updateEmergencyAlertStatus } from '@/lib/db/emergency';
import { createDonationRecord, updateUserLastDonationDate } from '@/lib/db/donation-records';
import { generateDonationConfirmationEmail } from '@/lib/email/donation-confirmation-template';
import { sendEmail } from '@/lib/email/service';
import { ObjectId } from 'mongodb';

// POST - Select a donor for emergency
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
    const { emergency_id, donor_id } = body;

    if (!emergency_id || !donor_id) {
      return NextResponse.json(
        { error: 'Emergency ID and donor ID are required' },
        { status: 400 }
      );
    }

    // Get emergency alert
    const alert = await getEmergencyAlertById(new ObjectId(emergency_id));
    if (!alert) {
      return NextResponse.json(
        { error: 'Emergency alert not found' },
        { status: 404 }
      );
    }

    // Check if user owns this emergency alert
    if (alert.user_id.toString() !== user._id?.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized to select donor for this emergency' },
        { status: 403 }
      );
    }

    // Check if alert is still active
    if (alert.status !== 'active') {
      return NextResponse.json(
        { error: 'Emergency alert is no longer active' },
        { status: 400 }
      );
    }

    // Get donor details
    const donor = await findUserById(donor_id);
    if (!donor) {
      return NextResponse.json(
        { error: 'Selected donor not found' },
        { status: 404 }
      );
    }

    // Create donation record for the selected donor
    const donationRecord = await createDonationRecord({
      donor_id: new ObjectId(donor_id),
      donation_date: new Date(),
      emergency_alert_id: new ObjectId(emergency_id),
      blood_group: donor.blood_group_public || 'Unknown',
      bags_donated: alert.required_bags,
      donation_place: alert.donation_place,
      emergency_serial_number: alert.serial_number
    });

    // Update donor's last donation date
    await updateUserLastDonationDate(new ObjectId(donor_id), new Date());

    // Mark emergency as fulfilled and set selected donor
    await updateEmergencyAlertStatus(
      new ObjectId(emergency_id),
      'fulfilled',
      undefined,
      alert.donors_responded + 1,
      new ObjectId(donor_id)
    );

    // Send confirmation email to selected donor
    try {
      const donationDate = alert.donation_date || new Date().toLocaleDateString();
      const donationTime = alert.donation_time || 'To be confirmed';
      
      const emailHtml = generateDonationConfirmationEmail({
        donorName: donor.name || `Donor ${donor.user_code}`,
        emergencyAlert: alert,
        donationDate,
        donationTime
      });

      // Note: In a real implementation, you'd need to store email addresses
      // For now, we'll use a mock email
      const donorEmail = `donor-${donor.user_code.toLowerCase()}@bloodnode.example`;
      
      await sendEmail({
        to: donorEmail,
        subject: `🎉 You've been selected! Emergency Blood Donation - ${alert.serial_number}`,
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the entire operation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Donor selected successfully and notification sent',
      donation_record_id: donationRecord._id?.toString(),
      emergency_serial_number: alert.serial_number,
      selected_donor: {
        user_code: donor.user_code,
        name: donor.name
      }
    });

  } catch (error) {
    console.error('Select donor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
