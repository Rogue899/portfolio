# MongoDB Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Connection String
MONGODB_URI=your-mongodb-connection-string-here

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-this-in-production
JWT_ISSUER=swiftserve
JWT_AUDIENCE=swiftserve-users
JWT_ACCESS_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

## Database Collections

The system uses the following MongoDB collections:

1. **users** - User accounts
   - `_id`: ObjectId
   - `email`: String (unique)
   - `password`: String (bcrypt hashed)
   - `name`: String (optional)

2. **files** - File storage
   - `_id`: ObjectId
   - `fileId`: String (unique per user)
   - `userId`: String (user ID)
   - `fileName`: String
   - `content`: String
   - `version`: Number
   - `createdAt`: Date
   - `updatedAt`: Date

3. **fileHistory** - File version history
   - `_id`: ObjectId
   - `fileId`: String
   - `userId`: String
   - `fileName`: String
   - `content`: String
   - `version`: Number
   - `savedAt`: Date

## Authentication

The system uses JWT tokens matching your existing authentication:
- **Access Token**: Expires in 7 days, used for API authentication
- **Refresh Token**: Expires in 30 days (refresh endpoint not yet implemented)
- Token payload includes: `id`, `type`, `email`, plus standard JWT claims
- Supports both header formats: `token` header and `Authorization: Bearer <token>`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Make sure your MongoDB database is accessible and the connection string is correct

## Usage

1. Users need to log in to save/view files
2. Files are stored per user (users can only see their own files)
3. File history is automatically saved when content changes
4. Users can view and restore previous versions from the file editor

