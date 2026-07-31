# MyLedger Backend Deployment Guide

Complete guide to deploy the MyLedger backend server for multi-user real-time sync with admin surveillance.

## 🚀 Quick Deployment Options

### Option 1: Railway (Easiest - Recommended)

**Prerequisites:**
- Railway account (free tier available)
- Git account (GitHub/GitLab/Bitbucket)

**Steps:**

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```

3. **Initialize Railway project:**
```bash
cd myledger-backend
railway init
```

4. **Add PostgreSQL database:**
```bash
railway add postgresql
```

5. **Get database URL:**
```bash
railway variables
# Copy the DATABASE_URL
```

6. **Update .env file:**
```env
DATABASE_URL="paste-your-railway-database-url-here"
PORT=3000
NODE_ENV=production
JWT_SECRET=generate-a-secure-random-string-here
ADMIN_PHONE=9999999999
ADMIN_PASSWORD=admin@123
```

7. **Deploy to Railway:**
```bash
railway up
```

8. **Run database migrations:**
```bash
railway run npx prisma migrate deploy
```

9. **Get your server URL:**
```bash
railway domain
# This will give you something like: https://myledger-backend.up.railway.app
```

10. **Update Android app server URL:**
   - Open `D:\travel\myledger\app\src\main\java\com\myledger\app\network\RetrofitClient.kt`
   - Change `BASE_URL` to your Railway URL

### Option 2: DigitalOcean VPS

**Prerequisites:**
- DigitalOcean account
- VPS with Ubuntu 20.04+
- Domain name (optional)

**Steps:**

1. **Create VPS:**
   - Go to DigitalOcean
   - Create Droplet (Ubuntu 20.04, $6/month basic plan)
   - Choose your region
   - Add SSH keys for secure access

2. **Connect to VPS:**
```bash
ssh root@your-vps-ip
```

3. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Install PostgreSQL:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

5. **Setup PostgreSQL database:**
```bash
sudo -u postgres psql
CREATE DATABASE myledger;
CREATE USER myledger_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE myledger TO myledger_user;
\q
```

6. **Install PM2 (process manager):**
```bash
npm install -g pm2
```

7. **Clone your backend code:**
```bash
git clone your-repo-url
cd myledger-backend
npm install
```

8. **Configure environment:**
```bash
nano .env
```
```env
PORT=3000
NODE_ENV=production
DATABASE_URL="postgresql://myledger_user:secure_password@localhost:5432/myledger?schema=public"
JWT_SECRET=your-secure-random-secret-key
ADMIN_PHONE=9999999999
ADMIN_PASSWORD=admin@123
```

9. **Run database migrations:**
```bash
npx prisma migrate deploy
npx prisma generate
```

10. **Start server with PM2:**
```bash
pm2 start src/server.js --name myledger-backend
pm2 save
pm2 startup
```

11. **Setup Nginx (optional but recommended):**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/myledger
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/myledger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

12. **Setup SSL with Let's Encrypt (optional):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Render.com

**Prerequisites:**
- Render account
- GitHub account

**Steps:**

1. **Push code to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-github-repo-url
git push -u origin main
```

2. **Create Render account:**
   - Go to render.com
   - Sign up/login

3. **Create PostgreSQL service:**
   - Click "New" → "PostgreSQL"
   - Choose instance name
   - Select region
   - Create database

4. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure build settings:
     - Build Command: `npm install`
     - Start Command: `node src/server.js`
   - Add environment variables from your PostgreSQL service
   - Add additional env vars:
     - `JWT_SECRET`: generate secure string
     - `ADMIN_PHONE`: 9999999999
     - `ADMIN_PASSWORD`: admin@123

5. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically deploy

## 🔧 Configuration

### Environment Variables (Required)

```env
PORT=3000                          # Server port
NODE_ENV=production               # Environment
DATABASE_URL=postgresql://...     # PostgreSQL connection string
JWT_SECRET=your-secure-secret      # JWT signing key
ADMIN_PHONE=9999999999            # Admin phone number
ADMIN_PASSWORD=admin@123          # Admin password
```

### Security Best Practices

1. **Generate secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Use strong database password:**
```bash
openssl rand -base64 32
```

3. **Enable firewall:**
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

4. **Keep dependencies updated:**
```bash
npm audit fix
npm update
```

## 📱 Android App Configuration

### Update Server URL

1. **Open:** `D:\travel\myledger\app\src\main\java\com\myledger\app\network\RetrofitClient.kt`

2. **Update BASE_URL:**
```kotlin
// For development (emulator):
private const val BASE_URL = "http://10.0.2.2:3000"

// For development (real device):
private const val BASE_URL = "http://YOUR_COMPUTER_IP:3000"

// For production:
private const val BASE_URL = "https://your-deployed-server.com"
```

### Build and Install APK

```bash
cd D:\travel\myledger
./gradlew.bat assembleDebug
```

APK location: `app/build/outputs/apk/debug/app-debug.apk`

## 🧪 Testing the Complete System

### 1. Backend Testing

**Test server is running:**
```bash
curl http://your-server-url:3000
```

**Test user signup:**
```bash
curl -X POST http://your-server-url:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "1234567890", "password": "user123", "name": "Test User"}'
```

**Test user login:**
```bash
curl -X POST http://your-server-url:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "1234567890", "password": "user123"}'
```

**Test admin login:**
```bash
curl -X POST http://your-server-url:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9999999999", "password": "admin@123"}'
```

### 2. Android App Testing

**User Flow:**
1. Install APK on device
2. Open app → Click "Sign Up"
3. Enter phone number and password
4. Create account
5. Use app features (add transactions, accounts, etc.)
6. Data syncs to backend automatically

**Admin Flow:**
1. Install APK on admin device
2. Open app → Click "Login"
3. Enter: Phone: 9999999999, Password: admin@123
4. Access admin surveillance features
5. View all users and their data
6. Edit user data in real-time
7. Changes sync instantly to user devices

### 3. Real-time Sync Testing

1. **User device:** Add a transaction
2. **Admin device:** Should see transaction appear instantly
3. **Admin device:** Edit transaction amount
4. **User device:** Should see updated amount instantly

## 🔍 Troubleshooting

### Backend Issues

**Server won't start:**
```bash
# Check logs
pm2 logs myledger-backend

# Restart server
pm2 restart myledger-backend

# Check port availability
netstat -tlnp | grep :3000
```

**Database connection issues:**
```bash
# Test database connection
psql postgresql://user:password@localhost:5432/myledger

# Check PostgreSQL status
sudo systemctl status postgresql
```

**Migration issues:**
```bash
# Reset database (development only)
npx prisma migrate reset

# View database schema
npx prisma studio
```

### Android App Issues

**Network connection errors:**
- Check server URL in RetrofitClient.kt
- Ensure device has internet connection
- Verify server is running and accessible
- Check firewall allows connections

**Sync not working:**
- Check Socket.io connection in logs
- Verify JWT token is valid
- Ensure user is authenticated
- Check network connectivity

**Login/signup failures:**
- Check backend logs for errors
- Verify phone number format
- Ensure password is correct
- Check network connectivity

## 📊 Monitoring

### Server Monitoring

**Using PM2:**
```bash
pm2 monit                    # Real-time monitoring
pm2 logs myledger-backend     # View logs
pm2 status                   # Check status
```

**Database Monitoring:**
```bash
npx prisma studio            # Visual database browser
```

### Health Check Endpoint

Add to your server:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

Test: `curl http://your-server-url:3000/health`

## 🔄 Continuous Deployment

### Automatic Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Railway

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: railwayapp/cli@v1.0
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          command: up
```

## 🎯 Production Checklist

- [ ] Backend deployed to production server
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured
- [ ] Server monitoring setup
- [ ] Backup strategy in place
- [ ] Android app server URL updated
- [ ] Admin credentials set (9999999999/admin@123)
- [ ] Tested user signup/login flow
- [ ] Tested admin surveillance features
- [ ] Tested real-time sync between devices
- [ ] APK built and tested
- [ ] Error monitoring setup

## 📞 Support

If you encounter issues:
1. Check server logs: `pm2 logs myledger-backend`
2. Check database connection: `npx prisma studio`
3. Test API endpoints with curl
4. Review Android app logs in Android Studio
5. Check network connectivity

## 🔐 Security Notes

- Never commit .env file to git
- Use strong passwords in production
- Keep dependencies updated
- Enable HTTPS in production
- Use firewall to restrict access
- Regular database backups
- Monitor server logs for suspicious activity
