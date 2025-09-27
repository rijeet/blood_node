// Accept family member invitation API route
import { NextRequest, NextResponse } from 'next/server';
import { validateVerificationToken, markTokenAsUsed } from '@/lib/db/verification';
import { findUserById } from '@/lib/db/users';

// GET - Show invitation details and acceptance form
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Family Invitation - Blood Node</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #dc2626; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🩸 Blood Node</h1>
            <div class="error">
              <h2>Invitation Error</h2>
              <p>No invitation token provided.</p>
            </div>
            <a href="/" class="button">Go to Home</a>
          </div>
        </body>
      </html>`,
      { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }

  // Validate the token
  const validation = await validateVerificationToken(token, 'family_invite');
  
  if (!validation.valid || !validation.token) {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Invitation Error - Blood Node</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #dc2626; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🩸 Blood Node</h1>
            <div class="error">
              <h2>Invitation Invalid</h2>
              <p>${validation.error || 'Invalid or expired invitation token'}</p>
            </div>
            <a href="/" class="button">Go to Home</a>
          </div>
        </body>
      </html>`,
      { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }

  const inviteToken = validation.token;
  
  if (!inviteToken.invite_data) {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Invitation Error - Blood Node</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #dc2626; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🩸 Blood Node</h1>
            <div class="error">
              <h2>Invalid Invitation</h2>
              <p>This invitation is malformed.</p>
            </div>
            <a href="/" class="button">Go to Home</a>
          </div>
        </body>
      </html>`,
      { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }

  try {
    // Get inviter details
    const inviter = await findUserById(inviteToken.invite_data.inviter_user_id.toString());
    
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    // Show invitation acceptance page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Family Invitation - Blood Node</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success { color: #16a34a; background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .info { background: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; }
            .button-secondary { background: #6b7280; }
            .permissions { background: #f9fafb; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .permissions ul { margin: 0; padding-left: 20px; }
            .user-code { background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🩸 Blood Node Family Invitation</h1>
            
            <div class="success">
              <h2>🎉 You're Invited!</h2>
              <p><strong>${inviteToken.invite_data.inviter_name}</strong> (${inviter.user_code}) has invited you to join his/her Blood Node family network as his/her <strong>${inviteToken.invite_data.relation}</strong>.</p>
            </div>
            
            <div class="info">
              <h3>What is Blood Node?</h3>
              <p>Blood Node is a secure, privacy-first platform for managing family blood type information and donation networks. Your data is encrypted end-to-end and only you control who can access it.</p>
              
              <h3>What they want to share:</h3>
              <div class="permissions">
                <ul>
                  ${inviteToken.invite_data.permissions.map(permission => `<li>${permission.replace('_', ' ')}</li>`).join('')}
                </ul>
              </div>
              
              <h3>Inviter Details:</h3>
              <div class="user-code">User Code: ${inviter.user_code}</div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p><strong>To accept this invitation:</strong></p>
              <ol style="text-align: left; display: inline-block;">
                <li>Create a Blood Node account (if you don't have one)</li>
                <li>Log in to your account</li>
                <li>Use the invitation code or connect directly</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="/?invite=${token}" class="button">Accept & Sign Up</a>
              <a href="/" class="button button-secondary">Go to Login</a>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 6px; font-size: 14px;">
              <p><strong>🔒 Your Privacy:</strong> You control what information you share, and you can revoke access at any time. This invitation expires in 24 hours.</p>
            </div>
          </div>
        </body>
      </html>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );

  } catch (error) {
    console.error('Invitation display error:', error);
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Invitation Error - Blood Node</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #dc2626; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🩸 Blood Node</h1>
            <div class="error">
              <h2>Invitation Error</h2>
              <p>An error occurred while processing your invitation. Please try again or contact support.</p>
            </div>
            <a href="/" class="button">Go to Home</a>
          </div>
        </body>
      </html>`,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// POST - Accept invitation (when user is logged in)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, accept } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Validate the token
    const validation = await validateVerificationToken(token, 'family_invite');
    
    if (!validation.valid || !validation.token) {
      return NextResponse.json(
        { error: validation.error || 'Invalid invitation token' },
        { status: 400 }
      );
    }

    const inviteToken = validation.token;

    if (accept === false) {
      // User declined the invitation
      await markTokenAsUsed(token);
      return NextResponse.json({
        success: true,
        message: 'Invitation declined'
      });
    }

    // Mark token as used (accepted)
    await markTokenAsUsed(token);

    // TODO: Create the actual family connection in the database
    // This would involve creating a relationship record between the users

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully!',
      connection: {
        inviter_user_code: inviteToken.invite_data?.inviter_name,
        relation: inviteToken.invite_data?.relation,
        permissions: inviteToken.invite_data?.permissions
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
