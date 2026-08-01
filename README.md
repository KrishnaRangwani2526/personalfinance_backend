# MyLedger Backend Server

Backend server for MyLedger app with real-time sync and admin surveillance capabilities.

## Features

- **Multi-user Authentication**: Simple phone number login for users, admin login with password
- **Real-time Sync**: Socket.io for instant data synchronization between users and admin
- **Admin Surveillance**: Admin can view and edit all user data in real-time
- **RESTful API**: Complete API for data management
- **PostgreSQL Database**: Robust data storage with Prisma ORM
- **Security**: JWT authentication, rate limiting, helmet security

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
cd myledger-backend
npm install
```

2. **Set up PostgreSQL database:**
```bash
# Create database
createdb myledger

# Or use psql
psql
CREATE DATABASE myledger;
```

3. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run database migrations:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Start the server:**
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/myledger?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Pre-configured Accounts

**Admin Account:**
- Phone Number: `9999999999`
- Password: `Admin@123`

**User Account:**
- Phone Number: `9928452506`
- Password: `9928452506`

Note: Only these two accounts can login. Signup functionality has been disabled.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with phone number
- `GET /api/auth/me` - Get current user info

### Data Sync
- `POST /api/data/sync` - Sync data to server
- `GET /api/data/sync` - Get data from server
- `POST /api/data/transactions` - Create transaction
- `PUT /api/data/transactions/:id` - Update transaction
- `DELETE /api/data/transactions/:id` - Delete transaction

### Admin (requires admin access)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get specific user data
- `PUT /api/admin/users/:userId` - Update user data
- `GET /api/admin/stats` - Get dashboard statistics
- `DELETE /api/admin/users/:userId` - Delete user

## Socket.io Events

### Client to Server
- `join` - Join user's room
- `data-update` - Send data update

### Server to Client
- `data-update` - Receive data updates
- `admin-update` - Receive admin updates

## Deployment

### Using Railway (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

3. Add PostgreSQL database:
```bash
railway add postgresql
```

4. Set environment variables in Railway dashboard

5. Run migrations:
```bash
railway run npx prisma migrate deploy
```

### Using VPS (DigitalOcean, AWS, etc.)

1. Install Node.js and PostgreSQL on your server
2. Clone the repository
3. Install dependencies
4. Set up environment variables
5. Run migrations
6. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start src/server.js --name myledger-backend
pm2 save
pm2 startup
```

## Admin Access

To access admin features:
1. Use the admin phone number from your .env file
2. Enter the admin password
3. You'll have full access to view and edit all user data

## Development

### Database Management
```bash
# Open Prisma Studio
npm run prisma:studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset
```

### Testing
```bash
# Start server in development mode
npm run dev

# Test API endpoints
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9999999999", "password": "SecureAdmin@2026!#ChangeThis"}'
```

## Security Notes

- Change JWT_SECRET in production
- Use strong admin password
- Enable HTTPS in production
- Keep dependencies updated
- Use environment variables for sensitive data
- Enable rate limiting in production

## Troubleshooting

### Database Connection Issues
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify database exists

### Socket.io Connection Issues
- Check CORS settings
- Verify client is using correct server URL
- Ensure firewall allows WebSocket connections

### Performance Issues
- Add database indexes
- Implement pagination for large datasets
- Use connection pooling
- Enable caching

## License

MIT
