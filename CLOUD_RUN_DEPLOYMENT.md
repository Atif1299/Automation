# 🚀 Deploy Verba Srl Automation Website to Google Cloud Run

## Overview
Google Cloud Run is a serverless platform that automatically scales your containerized application. Perfect for Node.js applications with variable traffic.

## Prerequisites
- Google Cloud Platform account
- Google Cloud SDK (gcloud) installed
- Docker installed on your local machine
- Your automation website code ready

## Step-by-Step Deployment Guide

### Step 1: Prepare Your Application

1. **Create a Dockerfile in your project root:**
```dockerfile
# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/admin-files

# Expose the port the app runs on
EXPOSE 8080

# Set environment variable for port
ENV PORT=8080

# Start the application
CMD ["node", "server.js"]
```

2. **Create a .dockerignore file:**
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.env.local
```

3. **Update your server.js to use Cloud Run port:**
```javascript
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
```

### Step 2: Set Up Google Cloud Project

1. **Install Google Cloud SDK:**
   - Download from: https://cloud.google.com/sdk/docs/install
   - Initialize: `gcloud init`

2. **Create a new project or select existing:**
```bash
# Create new project
gcloud projects create automations-andrea --name="Verba Automation"

# Set as active project
gcloud config set project automations-andrea
```

3. **Enable required APIs:**
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 3: Build and Deploy

1. **Build and submit to Google Cloud Build:**
```bash
# Navigate to your project directory
cd /path/to/your/automation-project

# Build and push the container image
gcloud builds submit --tag gcr.io/automations-andrea/automation-website
```

2. **Deploy to Cloud Run:**
```bash
gcloud run deploy automation-website \
    --image gcr.io/automations-andrea/automation-website \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --port 8080
```

### Step 4: Configure Environment Variables

1. **Set environment variables for production:**
```bash
gcloud run services update automation-website \
    --update-env-vars NODE_ENV=production \
    --update-env-vars MONGODB_URI=your-mongodb-connection-string \
    --update-env-vars JWT_SECRET=your-jwt-secret \
    --update-env-vars SESSION_SECRET=your-session-secret \
    --update-env-vars GCS_BUCKET_NAME=your-gcs-bucket-name \
    --update-env-vars GCS_KEYFILE=config/gcs-keyfile.json \
    --region us-central1
```

### Step 5: Set Up Database (MongoDB Atlas Recommended)

1. **Create MongoDB Atlas cluster:**
   - Go to https://cloud.mongodb.com/
   - Create free cluster
   - Get connection string
   - Whitelist Cloud Run IP ranges

2. **Update connection string in Cloud Run:**
```bash
gcloud run services update automation-website \
    --update-env-vars MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/automation?retryWrites=true&w=majority" \
    --region us-central1
```

### Step 6: Configure Custom Domain (Optional)

1. **Map custom domain:**
```bash
gcloud run domain-mappings create \
    --service automation-website \
    --domain automation.verbasrl.com \
    --region us-central1
```

2. **Update DNS records as instructed by Cloud Run**

### Step 7: Set Up HTTPS and Security

1. **Cloud Run automatically provides HTTPS**
2. **Configure security headers in your Express app:**
```javascript
// Add to your server.js
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
```

### Step 8: Monitoring and Logging

1. **View logs:**
```bash
gcloud run services logs tail automation-website --region us-central1
```

2. **Set up monitoring in Google Cloud Console**

## Cost Estimation
- **Free tier**: 2 million requests per month
- **Paid**: $0.40 per million requests
- **Memory**: $0.0000025 per GB-second
- **CPU**: $0.00002400 per vCPU-second

## Useful Commands

```bash
# View service details
gcloud run services describe automation-website --region us-central1

# Update service
gcloud run services update automation-website --region us-central1

# Delete service
gcloud run services delete automation-website --region us-central1

# View revisions
gcloud run revisions list --service automation-website --region us-central1
```

## Troubleshooting

1. **Build fails**: Check Dockerfile and .dockerignore
2. **Service won't start**: Check logs with `gcloud run services logs tail`
3. **Database connection issues**: Verify MongoDB connection string and whitelist IPs
4. **File upload issues**: Consider using Google Cloud Storage for file uploads

## 🔥 DIRECT GITHUB DEPLOYMENT (Recommended Method)

### Step 1: Prepare Repository
1. **Push your code to GitHub:**
```bash
git add .
git commit -m "Ready for Cloud Run deployment"
git push origin main
```

2. **Add required files to your repo root:**

**Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p uploads/admin-files
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
```

**.dockerignore:**
```
node_modules
.git
.env
npm-debug.log
```

### Step 2: Connect GitHub to Cloud Run

1. **Go to Cloud Run Console:**
   - Visit: https://console.cloud.google.com/run
   - Click "Create Service"

2. **Select "Continuously deploy new revisions from a source repository"**

3. **Set up Cloud Build (one-time setup):**
   - Click "Set up with Cloud Build"
   - Authenticate with GitHub
   - Select your repository: `Atif1299/Automation`
   - Branch: `main` or `improvements`

4. **Configure build:**
   - Build Type: `Dockerfile`
   - Source location: `/Dockerfile`

### Step 3: Deploy Settings
```
Service name: automation-website
Region: us-central1
CPU allocation: CPU is only allocated during request processing
Minimum instances: 0
Maximum instances: 10
Memory: 512 MiB
CPU: 1
Port: 8080
Allow unauthenticated invocations: ✓
```

### Step 4: Set Environment Variables
```
NODE_ENV=production
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
GCS_BUCKET_NAME=your-gcs-bucket-name
GCS_KEYFILE=config/gcs-keyfile.json
```

### Step 5: That's It! 🎉
- **Every push to main branch = Automatic deployment**
- **View builds:** Cloud Build History
- **View logs:** Cloud Run service logs
- **Custom domain:** Map in Cloud Run console

## Alternative: GitHub Actions (Advanced)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: google-github-actions/setup-gcloud@v0
      with:
        project_id: automations-andrea
        service_account_key: ${{ secrets.GCP_SA_KEY }}
    - run: gcloud builds submit --tag gcr.io/automations-andrea/automation-website
    - run: gcloud run deploy automation-website --image gcr.io/automations-andrea/automation-website --platform managed --region us-central1 --allow-unauthenticated
```

## Final Notes
- Cloud Run is serverless and scales to zero when not in use
- Perfect for applications with variable traffic
- Automatic HTTPS and global CDN
- Pay only for what you use
- Great for development and production environments
