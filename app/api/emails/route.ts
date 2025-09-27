// Email management and tracking API route
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { 
  getEmailStatus, 
  cancelEmail, 
  sendBatchEmails, 
  sendEmail, 
  EmailTemplate, 
  EmailDeliveryStatus 
} from '@/lib/email/service';

// GET - Get email status or list emails
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

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('id');
    const action = searchParams.get('action');

    if (emailId && action === 'status') {
      // Get specific email status
      const result = await getEmailStatus(emailId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      const emailStatus: EmailDeliveryStatus = {
        id: result.data?.id || '',
        status: mapResendStatusToOurStatus(result.data?.last_event || 'unknown'),
        email: Array.isArray(result.data?.to) ? result.data.to[0] : result.data?.to || '',
        subject: result.data?.subject || '',
        sent_at: result.data?.created_at || new Date().toISOString(),
        delivered_at: result.data?.last_event === 'delivered' ? result.data.created_at : undefined,
        last_event: result.data?.last_event || 'unknown'
      };

      return NextResponse.json({
        success: true,
        email: emailStatus
      });
    }

    // Return email service statistics for the user
    return NextResponse.json({
      success: true,
      statistics: {
        available_actions: [
          'send_single_email',
          'send_batch_emails',
          'check_email_status',
          'cancel_scheduled_email'
        ],
        service_status: 'active',
        provider: 'Resend',
        features: {
          batch_sending: true,
          scheduled_emails: true,
          email_tracking: true,
          retry_mechanism: true,
          template_system: true
        }
      }
    });

  } catch (error) {
    console.error('Get email info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Send email or batch emails
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
    const { type, emails, email } = body;

    if (type === 'batch' && emails) {
      // Send batch emails
      if (!Array.isArray(emails) || emails.length === 0) {
        return NextResponse.json(
          { error: 'Emails array is required for batch sending' },
          { status: 400 }
        );
      }

      // Validate each email in the batch
      const validatedEmails: EmailTemplate[] = emails.map((email: any, index: number) => {
        if (!email.to || !email.subject || !email.html) {
          throw new Error(`Email at index ${index} is missing required fields (to, subject, html)`);
        }
        return {
          to: email.to,
          subject: email.subject,
          html: email.html,
          from: email.from || 'Blood Node <onboarding@resend.dev>'
        };
      });

      const result = await sendBatchEmails(validatedEmails);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Batch of ${validatedEmails.length} emails sent successfully`,
        batch_results: result.data,
        emails_sent: validatedEmails.length
      });

    } else if (email) {
      // Send single email
      if (!email.to || !email.subject || !email.html) {
        return NextResponse.json(
          { error: 'Email must have to, subject, and html fields' },
          { status: 400 }
        );
      }

      const emailTemplate: EmailTemplate = {
        to: email.to,
        subject: email.subject,
        html: email.html,
        from: email.from || 'Blood Node <onboarding@resend.dev>'
      };

      const result = await sendEmail(emailTemplate);
      
      if (!result.success) {
        return NextResponse.json(
          { 
            error: result.error,
            attempt: result.attempt,
            max_retries: result.maxRetries,
            non_retryable: result.nonRetryable || false
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        email_id: result.data?.id,
        attempt: result.attempt,
        max_retries: result.maxRetries
      });

    } else {
      return NextResponse.json(
        { error: 'Either specify type="batch" with emails array, or provide single email object' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel scheduled email
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('id');

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    const result = await cancelEmail(emailId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email cancelled successfully',
      email_id: emailId
    });

  } catch (error) {
    console.error('Cancel email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Map Resend status to our standard status
 */
function mapResendStatusToOurStatus(resendStatus: string): EmailDeliveryStatus['status'] {
  switch (resendStatus?.toLowerCase()) {
    case 'queued':
    case 'sending':
      return 'pending';
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'bounced':
      return 'bounced';
    case 'complained':
      return 'complained';
    case 'failed':
    default:
      return 'failed';
  }
}
