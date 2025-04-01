# Papercup Authentication System

## Overview

Papercup implements a comprehensive authentication system with the following features:

1. Email & Password authentication (via Devise)
2. Google OAuth2 integration for social login
3. JWT-based API authentication for backend API access

## Setup

### Google OAuth2 Configuration

1. Create a Google Cloud Platform project at https://console.cloud.google.com
2. Navigate to "APIs & Services" > "Credentials"
3. Create an OAuth 2.0 Client ID
4. Set the authorized redirect URI to: `https://your-app-domain.com/users/auth/google_oauth2/callback`
5. Add the following environment variables to your `.env` file:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Usage

### Web Authentication (Devise)

Standard Devise authentication is available through:

- `/login` - User login
- `/signup` - User registration
- `/users/password/new` - Password reset

### Google OAuth Authentication

Users can sign in or sign up using their Google account by clicking the "Sign in with Google" button on the login or registration pages.

### API Authentication (JWT)

For API authentication, use JWT tokens:

1. Obtain a token by authenticating via:
   - POST `/api/sessions` with `{ "email": "user@example.com", "password": "password" }`
   - Response includes a JWT token: `{ "token": "eyJhbG..." }`

2. Use the token in subsequent requests:
   - Include in the Authorization header: `Authorization: Bearer eyJhbG...`
   - Or include as a query parameter: `?token=eyJhbG...`

3. Check authentication status:
   - GET `/api/sessions/check` (with token)
   - Returns user data if authenticated

4. Logout:
   - DELETE `/api/sessions` (with token)

## Security Considerations

1. JWT tokens expire after 2 hours by default
2. Tokens are stored in httpOnly cookies for web sessions
3. CSRF protection is enabled for all non-API requests
4. All OAuth secrets are stored securely in environment variables
5. Password requirements follow Devise's defaults (minimum 6 characters) 