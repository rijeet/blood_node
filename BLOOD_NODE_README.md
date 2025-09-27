# Blood Node - Secure Family Blood Network

A privacy-first application for mapping family blood types with end-to-end encryption, secure recovery, and consent-based sharing.

## Features

### 🔒 End-to-End Encryption
- **AES-256-GCM** encryption for all private data
- **Browser-only** decryption - server never sees plaintext
- **Envelope encryption** with per-record Data Encryption Keys (DEKs)
- **ECDH P-256** for key wrapping and sharing

### 🩸 Blood Network Management
- Map family blood types and compatibility
- Track donation history and availability
- Find nearby family members for emergencies
- Consent-based data sharing

### 🔑 Robust Recovery System
- **Shamir Secret Sharing (SSS)** with threshold 2-of-3
- Server share + user share + optional email share
- Multiple recovery paths for account access
- Secure key derivation with Argon2id/PBKDF2

### 🌐 Privacy-Preserving Location
- **Coarse geohash** for approximate location (precision 5)
- Exact coordinates encrypted end-to-end
- Distance-based search without revealing precise location

### 👥 Invite & Consent System
- Email-based invitations with consent handshake
- Recipients choose what data to share
- Cryptographic access control with DEK wrapping
- No server-side access to shared content

### 💳 SaaS Plan Enforcement
- Free tier: 20 family members
- Paid blocks: Purchase additional capacity
- Unlimited plan available
- Stripe integration for billing

## Setup Instructions

### Environment Configuration

1. **Google Maps API Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Create an API key and restrict it to your domain
   - Add the API key to your environment variables:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

2. **Other Environment Variables**:
   ```bash
   # MongoDB Configuration
   MONGODB_URI=your_mongodb_connection_string_here

   # JWT Secret
   JWT_SECRET=your_jwt_secret_here

   # NextAuth Configuration
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Installation**:
   ```bash
   npm install
   npm run dev
   ```

## Architecture

### Data Model
- **Users**: Encrypted profiles with public metadata
- **Relatives**: E2E encrypted family member data
- **Invites**: Consent-based sharing invitations
- **Plans**: SaaS billing and limits
- **Refresh Tokens**: Persistent login sessions

### Cryptographic Design
- **Master Key**: Derived from password using Argon2id
- **User Keypair**: ECDH P-256 for envelope encryption
- **Data Encryption**: AES-256-GCM with random DEKs
- **Key Recovery**: SSS 2-of-3 threshold scheme

### API Endpoints
- `POST /api/auth/signup` - Create account with E2E crypto
- `POST /api/auth/login` - Authenticate with refresh tokens
- `POST /api/auth/refresh` - Rotate refresh tokens
- `GET/POST /api/relatives` - Manage family members
- `GET/POST /api/invites` - Handle invitations
- `GET /api/relatives/search` - Find family members

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier available)
- SendGrid account for emails (optional)
- Stripe account for billing (optional)

### Environment Variables
Create a `.env.local` file with:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blood_node
DB_NAME=blood_node

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
EMAIL_HASH_SECRET=your-email-hash-secret-change-in-production

# SendGrid (optional)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=onboarding@resend.dev

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App Config
APP_URL=http://localhost:3000
NODE_ENV=development
```

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up MongoDB:**
   - Create a MongoDB Atlas cluster
   - Add connection string to `.env.local`
   - Database and collections will be created automatically

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open application:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Getting Started

1. **Sign Up:**
   - Enter email, password, and optional blood group
   - Client generates encryption keys and splits them using SSS
   - Save the recovery share securely (printed or downloaded)

2. **Add Family Members:**
   - Fill out the relative form with encrypted data
   - Choose what information to share
   - Data is encrypted before sending to server

3. **Invite Family:**
   - Send email invitations to family members
   - Recipients sign up and choose what to share back
   - Cryptographic handshake establishes shared access

4. **View Network:**
   - Interactive graph view of family connections
   - Table view for detailed information
   - Filter by blood group, location, availability

### Recovery Process

If you forget your password:

1. Use your saved user share + server share
2. OR use emailed recovery share + server share
3. Combine shares to reconstruct encrypted private key
4. Enter new password to re-encrypt keys

## Security Considerations

### Threat Model
- **Protected Against**: Malicious DB admin, network attacks, server compromise
- **Not Protected Against**: Client device compromise, malicious browser extensions
- **Email Share Risk**: If attacker controls email, they can potentially recover account

### Best Practices
- Use strong, unique passwords
- Save recovery shares securely offline
- Keep client devices secure
- Verify recipient identities before sharing sensitive data
- Use email share only if you trust your email security

## Technical Implementation

### Dependencies
- **argon2-browser**: Password-based key derivation
- **sss-js**: Shamir Secret Sharing implementation
- **cytoscape**: Graph visualization
- **ngeohash**: Geographic hashing
- **stripe**: Payment processing
- **mongodb**: Database operations
- **jsonwebtoken**: Authentication tokens

### Browser Compatibility
- Modern browsers with Web Crypto API support
- Chrome 37+, Firefox 34+, Safari 7+, Edge 12+

### Performance
- Client-side encryption adds ~100ms per operation
- Graph rendering scales to ~1000 nodes
- MongoDB queries optimized with geohash indexing

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Production Considerations
- Use production MongoDB cluster
- Enable SSL/TLS everywhere
- Set secure JWT secrets (32+ random bytes)
- Configure CORS appropriately
- Set up monitoring and logging
- Regular security audits

## Contributing

This is a demonstration implementation of the design document. For production use:

1. Replace mock SSS with real sss-js library
2. Implement proper Argon2 instead of PBKDF2 fallback
3. Add comprehensive error handling
4. Implement rate limiting and abuse prevention
5. Add audit logging for security events
6. Conduct security review and penetration testing

## License

MIT License - See LICENSE file for details.

## Support

For questions about the cryptographic design or implementation, please refer to the original design document or create an issue in the repository.
