# MongoDB Setup Guide for Automation Platform

## 🚀 Quick Setup

### 1. **MongoDB Atlas (Recommended for Production)**

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free account
2. **Create Cluster**: Create a new cluster (free tier available)
3. **Get Connection String**: 
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
4. **Update .env file**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/automation_platform?retryWrites=true&w=majority
   ```

### 2. **Local MongoDB (Development)**

1. **Install MongoDB**: Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. **Start MongoDB**: Run `mongod` command
3. **Update .env file**:
   ```
   MONGODB_URI=mongodb://localhost:27017/automation_platform
   ```

## 📁 Project Structure

```
automation_platform/
├── config/
│   └── database.js          # Database connection
├── models/
│   ├── Client.js            # Client data model
│   └── Admin.js             # Admin user model
├── scripts/
│   └── initDatabase.js      # Database initialization
├── .env                     # Environment variables
└── .env.example            # Environment template
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and update:

```bash
# Required
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
PORT=3000

# Security
JWT_SECRET=your_secret_key_here

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_password
```

## 📊 Database Collections

### **Clients Collection**
- Client information and credentials
- Campaign configurations
- File uploads tracking
- Activity logs

### **Admins Collection**
- Admin user accounts
- Permissions and roles
- Login tracking
- Activity logs

## 🎯 Features Implemented

### **Client Dashboard Integration**
- ✅ Save credentials to database
- ✅ File upload tracking
- ✅ Campaign configuration storage
- ✅ Real-time activity logging
- ✅ Data validation and encryption

### **Security Features**
- ✅ Password encryption (bcrypt)
- ✅ Environment variable protection
- ✅ Database connection security
- ✅ Input validation

## 🚀 Deployment Ready

### **Production Checklist**
- [ ] Update MongoDB connection string
- [ ] Set strong JWT secret
- [ ] Configure admin credentials
- [ ] Set NODE_ENV=production
- [ ] Enable SSL/HTTPS
- [ ] Configure backup strategy

### **Scaling Considerations**
- MongoDB Atlas auto-scaling
- Connection pooling configured
- Indexes optimized for queries
- Error handling and logging

## 📈 Next Steps for Admin Dashboard

1. **Admin Authentication**: Login system
2. **Client Management**: View/edit client data
3. **Campaign Monitoring**: Real-time campaign status
4. **Analytics Dashboard**: Charts and reports
5. **File Management**: Upload processing
6. **System Settings**: Configuration panel

## 🛠️ Commands

```bash
# Install dependencies
npm install

# Initialize database
npm run init-db

# Start development server
npm run dev

# Start production server
npm start
```

## 🔍 Testing the Setup

1. **Start Server**: `npm start`
2. **Visit**: `http://localhost:3000/client/1`
3. **Fill Credentials**: Test the form submission
4. **Check Database**: Verify data is saved
5. **Monitor Logs**: Check console for database operations

## 📞 Support

- Check database connection in console logs
- Verify .env file configuration
- Ensure MongoDB service is running
- Review error messages for troubleshooting
