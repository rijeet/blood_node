// Emergency blood donor alert system
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { createEmergencyAlert, updateEmergencyAlertStatus } from '@/lib/db/emergency';
import { getUsersWithAvailability } from '@/lib/db/users';
import { createEmergencyNotificationsForUsers } from '@/lib/db/notifications';
import { getGeohashesInRadius } from '@/lib/geo';
import { sendEmail, sendBatchEmails } from '@/lib/email/service';
import { ObjectId } from 'mongodb';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

// POST - Send emergency alert to nearby donors
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
      blood_type, 
      lat, 
      lng, 
      radius_km = 25,
      urgency_level = 'high', // low, medium, high, critical
      // New emergency fields
      required_bags,
      hemoglobin_level,
      donation_place,
      donation_date,
      donation_time,
      contact_info,
      reference,
      patient_condition,
      location_address
    } = body;

    // Validate required fields
    if (!blood_type || lat === undefined || lng === undefined || !required_bags) {
      return NextResponse.json(
        { error: 'Blood type, latitude, longitude, and required bags are required' },
        { status: 400 }
      );
    }

    // Validate blood type
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodTypes.includes(blood_type)) {
      return NextResponse.json(
        { error: 'Invalid blood type' },
        { status: 400 }
      );
    }

    // Validate urgency level
    const validUrgencyLevels = ['low', 'medium', 'high', 'critical'];
    if (!validUrgencyLevels.includes(urgency_level)) {
      return NextResponse.json(
        { error: 'Invalid urgency level' },
        { status: 400 }
      );
    }

    // Get geohashes for the search area
    const geohashes = getGeohashesInRadius(lat, lng, radius_km, 5);
    
    // Find compatible donors in the area using geohash
    const donors = await getUsersWithAvailability({
      blood_group: blood_type,
      geohashes: geohashes,
      public_profile: true
    });

    if (donors.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No compatible donors found in the specified area',
        alert_sent: false,
        donors_notified: 0
      });
    }

    // Create emergency alert in database first
    const emergencyAlert = await createEmergencyAlert(
      new ObjectId(user._id),
      {
        blood_type,
        location_lat: lat,
        location_lng: lng,
        location_address,
        radius_km,
        urgency_level,
        patient_condition,
        required_bags: parseInt(required_bags),
        hemoglobin_level,
        donation_place,
        donation_date,
        donation_time,
        contact_info,
        reference
      }
    );

    // Create email map
    const userEmailMap = new Map();
    donors.forEach(donor => {
      // Note: In a real implementation, you'd need to store email addresses
      // For now, we'll use a mock email based on user code
      userEmailMap.set(donor.user_code, `donor-${donor.user_code.toLowerCase()}@bloodnode.example`);
    });

    // Prepare emergency alert emails
    const alertEmails = donors.map(donor => {
      const urgencyEmojis: Record<string, string> = {
        low: '🟡',
        medium: '🟠', 
        high: '🔴',
        critical: '🚨'
      };

      const urgencyColors: Record<string, string> = {
        low: '#fbbf24',
        medium: '#f97316',
        high: '#ef4444',
        critical: '#dc2626'
      };

      const urgencyText: Record<string, string> = {
        low: 'Low Priority',
        medium: 'Medium Priority',
        high: 'High Priority',
        critical: 'CRITICAL - Life Threatening'
      };

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: ${urgencyColors[urgency_level]}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
              .alert-box { background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .urgent { color: #dc2626; font-weight: bold; }
              .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
              .info-box { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${urgencyEmojis[urgency_level]} EMERGENCY BLOOD ALERT</h1>
                <p>${urgencyText[urgency_level]}</p>
              </div>
              <div class="content">
                <div class="alert-box">
                  <h2>🚨 URGENT: Blood Donation Needed</h2>
                  <p><strong>Blood Type Required:</strong> <span class="urgent">${blood_type}</span></p>
                  <p><strong>Required Bags:</strong> ${required_bags} bag(s)</p>
                  ${patient_condition ? `<p><strong>Patient Condition:</strong> ${patient_condition}</p>` : ''}
                  ${hemoglobin_level ? `<p><strong>Hemoglobin Level:</strong> ${hemoglobin_level}</p>` : ''}
                  ${donation_place ? `<p><strong>Donation Place:</strong> ${donation_place}</p>` : ''}
                  ${donation_date ? `<p><strong>Donation Date:</strong> ${donation_date}</p>` : ''}
                  ${donation_time ? `<p><strong>Donation Time:</strong> ${donation_time}</p>` : ''}
                  ${contact_info ? `<p><strong>Contact:</strong> ${contact_info}</p>` : ''}
                  ${reference ? `<p><strong>Reference:</strong> ${reference}</p>` : ''}
                </div>

                <h3>📍 Location Details</h3>
                <div class="info-box">
                  ${location_address ? `<p><strong>Address:</strong> ${location_address}</p>` : ''}
                  <p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                  <p><strong>Search Radius:</strong> ${radius_km}km</p>
                  <p><strong>Alert Time:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <h3>🩸 Your Blood Type: ${donor.blood_type}</h3>
                <p>You are a compatible donor for this emergency!</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://bloodnode.app/emergency/respond?alert_id=${Date.now()}&donor_code=${donor.user_code}" class="button">
                    I Can Help - Respond Now
                  </a>
                  <a href="https://bloodnode.app/emergency/decline?alert_id=${Date.now()}&donor_code=${donor.user_code}" class="button" style="background: #6b7280;">
                    Cannot Help Right Now
                  </a>
                </div>

                <div class="alert-box">
                  <h3>⚠️ Important Notes</h3>
                  <ul>
                    <li>This is an emergency alert - please respond quickly if you can help</li>
                    <li>Only respond if you are healthy and eligible to donate</li>
                    <li>Contact the hospital directly for specific requirements</li>
                    <li>Your response helps save lives!</li>
                  </ul>
                </div>
              </div>
              <div class="footer">
                <p>This alert was sent through Blood Node's emergency system.</p>
                <p>If you cannot help, please decline to help us find other donors.</p>
                <p>&copy; 2024 Blood Node - Emergency Blood Network</p>
              </div>
            </div>
          </body>
        </html>
      `;

      return {
        to: userEmailMap.get(donor.user_code) || `donor-${donor.user_code}@bloodnode.example`,
        subject: `${urgencyEmojis[urgency_level]} URGENT: ${blood_type} Blood Needed - ${required_bags} bag(s) - ${patient_condition || 'Emergency'}`,
        html
      };
    });

    // Send emergency alert emails
    let emailsSent = 0;
    try {
      const emailResult = await sendBatchEmails(alertEmails);
      if (emailResult.success) {
        emailsSent = alertEmails.length;
        console.log(`Emergency alert sent to ${emailsSent} donors`);
      } else {
        console.error('Failed to send emergency alert emails:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Emergency email error:', emailError);
    }

    // Create notifications for all users in the area (not just compatible donors)
    const allUsersInArea = await getUsersWithAvailability({
      geohashes: geohashes,
      public_profile: true
    });

    // Create notifications for users who might be interested in the emergency
    const notificationUserIds = allUsersInArea.map(user => new ObjectId(user._id));
    
    if (notificationUserIds.length > 0) {
      await createEmergencyNotificationsForUsers(
        emergencyAlert._id!,
        blood_type,
        emergencyAlert.location_geohash,
        location_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        urgency_level,
        notificationUserIds
      );
    }

    // Update the emergency alert with notification count
    await updateEmergencyAlertStatus(
      emergencyAlert._id!,
      'active',
      emailsSent,
      0
    );

    return NextResponse.json({
      success: true,
      message: 'Emergency alert sent successfully',
      alert_sent: true,
      donors_notified: emailsSent,
      total_donors_found: donors.length,
      alert_id: emergencyAlert._id?.toString(),
      alert_details: {
        blood_type,
        location: { lat, lng },
        location_address,
        radius_km,
        urgency_level,
        required_bags,
        patient_condition
      }
    });

  } catch (error) {
    console.error('Emergency alert error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get emergency alert statistics
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

    // Connect to database
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const alertsCollection = client.db(DB_NAME).collection('emergency_alerts');
    const donorsCollection = client.db(DB_NAME).collection('donor_locations');
    
    // Get statistics
    const [totalAlerts, recentAlerts, emergencyDonors] = await Promise.all([
      alertsCollection.countDocuments({}),
      alertsCollection.countDocuments({
        created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }),
      donorsCollection.countDocuments({ emergency_contact: true, is_available: true })
    ]);

    return NextResponse.json({
      success: true,
      statistics: {
        total_alerts_sent: totalAlerts,
        alerts_last_24h: recentAlerts,
        emergency_donors_available: emergencyDonors,
        urgency_levels: ['low', 'medium', 'high', 'critical'],
        max_radius_km: 100,
        min_radius_km: 1
      }
    });

  } catch (error) {
    console.error('Get emergency statistics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
