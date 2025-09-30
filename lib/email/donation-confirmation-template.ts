import { EmergencyAlert } from '../models/emergency';

export interface DonationConfirmationData {
  donorName: string;
  emergencyAlert: EmergencyAlert;
  donationDate: string;
  donationTime: string;
}

export function generateDonationConfirmationEmail(data: DonationConfirmationData): string {
  const { donorName, emergencyAlert, donationDate, donationTime } = data;

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

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${urgencyColors[emergencyAlert.urgency_level]}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
          .alert-box { background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .urgent { color: #dc2626; font-weight: bold; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
          .info-box { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .section { margin: 25px 0; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1f2937; }
          .field { margin: 10px 0; }
          .field-label { font-weight: 600; color: #374151; }
          .field-value { color: #1f2937; margin-left: 10px; }
          .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${urgencyEmojis[emergencyAlert.urgency_level]} DONATION CONFIRMATION</h1>
            <p>${urgencyText[emergencyAlert.urgency_level]}</p>
            <p>Serial Number: <span class="highlight">${emergencyAlert.serial_number}</span></p>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <h2>🎉 Thank You, ${donorName}!</h2>
              <p>You have been selected to help with this emergency blood donation request. Your willingness to help saves lives!</p>
            </div>

            <div class="section">
              <h3 class="section-title">💁‍♂️ Patient's Information</h3>
              <div class="field">
                <span class="field-label">Blood Group Required *</span>
                <span class="field-value urgent">${emergencyAlert.blood_type}</span>
              </div>
              <div class="field">
                <span class="field-label">Patient's Condition</span>
                <span class="field-value">${emergencyAlert.patient_condition || 'Not specified'}</span>
              </div>
              <div class="field">
                <span class="field-label">Required Blood: ___ bag(s) *</span>
                <span class="field-value urgent">${emergencyAlert.required_bags} bag(s)</span>
              </div>
              ${emergencyAlert.hemoglobin_level ? `
                <div class="field">
                  <span class="field-label">Hemoglobin Level</span>
                  <span class="field-value">${emergencyAlert.hemoglobin_level}</span>
                </div>
              ` : ''}
            </div>

            <div class="section">
              <h3 class="section-title">🏥 Donation Details</h3>
              <div class="field">
                <span class="field-label">Donation Place</span>
                <span class="field-value">${emergencyAlert.donation_place || 'To be confirmed'}</span>
              </div>
              <div class="field">
                <span class="field-label">📆 Donation Date</span>
                <span class="field-value">${donationDate}</span>
              </div>
              <div class="field">
                <span class="field-label">⏰ Donation Time</span>
                <span class="field-value">${donationTime}</span>
              </div>
              ${emergencyAlert.contact_info ? `
                <div class="field">
                  <span class="field-label">☎️ Contact</span>
                  <span class="field-value">${emergencyAlert.contact_info}</span>
                </div>
              ` : ''}
              ${emergencyAlert.reference ? `
                <div class="field">
                  <span class="field-label">📖 Reference</span>
                  <span class="field-value">${emergencyAlert.reference}</span>
                </div>
              ` : ''}
            </div>

            <div class="section">
              <h3 class="section-title">📍 Location Information</h3>
              <div class="info-box">
                ${emergencyAlert.location_address ? `
                  <p><strong>Address:</strong> ${emergencyAlert.location_address}</p>
                ` : ''}
                <p><strong>Coordinates:</strong> ${emergencyAlert.location_lat.toFixed(6)}, ${emergencyAlert.location_lng.toFixed(6)}</p>
                <p><strong>Search Radius:</strong> ${emergencyAlert.radius_km}km</p>
                <p><strong>Alert Created:</strong> ${new Date(emergencyAlert.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div class="alert-box">
              <h3>⚠️ Important Instructions</h3>
              <ul>
                <li><strong>Please arrive on time</strong> for your scheduled donation</li>
                <li><strong>Bring a valid ID</strong> and any required medical documents</li>
                <li><strong>Eat a healthy meal</strong> before donating and stay hydrated</li>
                <li><strong>Contact the hospital directly</strong> if you have any questions or need to reschedule</li>
                <li><strong>Your donation will be tracked</strong> in your Blood Node profile</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://bloodnode.app/emergency/respond/${emergencyAlert._id?.toString()}" class="button">
                View Full Emergency Details
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>This confirmation was sent through Blood Node's emergency system.</p>
            <p>Thank you for being a lifesaver! 🩸</p>
            <p>&copy; 2024 Blood Node - Emergency Blood Network</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
