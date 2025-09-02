# 🖥️ Deploy Verba Srl Automation Website to Google Compute Engine

## Overview
Google Compute Engine provides virtual machines where you have full control over the server environment. Ideal for applications requiring persistent storage, specific configurations, or predictable performance.

## Prerequisites
- Google Cloud Platform account
- Google Cloud SDK (gcloud) installed
- SSH key pair for secure access
- Your automation website code ready

## Step-by-Step Deployment Guide

### Step 1: Set Up Google Cloud Project

1. **Install Google Cloud SDK:**
   - Download from: https://cloud.google.com/sdk/docs/install
   - Initialize: `gcloud init`

2. **Create a new project or select existing:**
```bash
# Create new project
gcloud projects create verba-automation-vm --name="Verba Automation VM"

# Set as active project
gcloud config set project verba-automation-vm
```

3. **Enable required APIs:**
```bash
gcloud services enable compute.googleapis.com
gcloud services enable cloudsql.googleapis.com
```

### Step 2: Create Virtual Machine Instance

1. **Create VM instance:**
```bash
gcloud compute instances create automation-server \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=your-service-account@verba-automation-vm.iam.gserviceaccount.com \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=http-server,https-server \
    --create-disk=auto-delete=yes,boot=yes,device-name=automation-server,image=projects/ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20231213,mode=rw,size=20,type=projects/verba-automation-vm/zones/us-central1-a/diskTypes/pd-standard \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --reservation-affinity=any
```

2. **Create firewall rules:**
```bash
# Allow HTTP traffic
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --tags http-server

# Allow HTTPS traffic
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --tags https-server

# Allow custom Node.js port (if needed)
gcloud compute firewall-rules create allow-nodejs \
    --allow tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --tags nodejs-server
```

### Step 3: Connect to VM and Install Dependencies

1. **SSH into the VM:**
```bash
gcloud compute ssh automation-server --zone=us-central1-a
```

2. **Update system packages:**
```bash
sudo apt update && sudo apt upgrade -y
```

3. **Install Node.js and npm:**
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

4. **Install PM2 (Process Manager):**
```bash
sudo npm install -g pm2
```

5. **Install Git:**
```bash
sudo apt install git -y
```

6. **Install Nginx (Web Server):**
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 4: Deploy Your Application

1. **Clone your repository or upload files:**
```bash
# Option 1: Clone from Git
git clone https://github.com/Atif1299/Automation.git
cd Automation

# Option 2: Create project directory and upload files
mkdir -p /home/ubuntu/automation-app
cd /home/ubuntu/automation-app
# Transfer files using scp or gcloud compute scp
```

2. **Transfer files using gcloud scp:**
```bash
# From your local machine
gcloud compute scp --recurse /path/to/your/automation-project automation-server:~/automation-app --zone=us-central1-a
```

3. **Install application dependencies:**
```bash
cd ~/automation-app
npm install
```

4. **Create production environment file:**
```bash
nano .env
```
Add your environment variables:
```
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/automation
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here
PORT=3000
```

### Step 5: Set Up MongoDB Database

1. **Install MongoDB:**
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create MongoDB repository file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

2. **Secure MongoDB:**
```bash
# Connect to MongoDB
mongo

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "your-secure-password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create application database and user
use automation
db.createUser({
  user: "automationuser",
  pwd: "your-app-password",
  roles: [ { role: "readWrite", db: "automation" } ]
})

exit
```

3. **Enable MongoDB authentication:**
```bash
sudo nano /etc/mongod.conf
```
Add these lines:
```yaml
security:
  authorization: enabled
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

### Step 6: Configure Nginx as Reverse Proxy

1. **Create Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/automation-app
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration (add your SSL certificates)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /css/ {
        alias /home/ubuntu/automation-app/public/css/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /js/ {
        alias /home/ubuntu/automation-app/public/js/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File uploads
    client_max_body_size 50M;
}
```

2. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/automation-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Set Up SSL Certificate

1. **Install Certbot for Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

2. **Obtain SSL certificate:**
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

3. **Set up auto-renewal:**
```bash
sudo crontab -e
```
Add this line:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 8: Start Application with PM2

1. **Create PM2 ecosystem file:**
```bash
nano ecosystem.config.js
```

Add this configuration:
```javascript
module.exports = {
  apps: [{
    name: 'automation-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    restart_delay: 1000
  }]
};
```

2. **Create logs directory:**
```bash
mkdir logs
```

3. **Start application:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 9: Set Up Monitoring and Backup

1. **Install monitoring tools:**
```bash
# Install htop for system monitoring
sudo apt install htop -y

# Install MongoDB monitoring
sudo npm install -g mongodb-tools
```

2. **Create backup script:**
```bash
nano backup.sh
```

Add this script:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --host localhost --port 27017 --db automation --out $BACKUP_DIR/mongodb_$DATE

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /home/ubuntu/automation-app

# Remove backups older than 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make it executable and set up cron job:
```bash
chmod +x backup.sh
crontab -e
```
Add daily backup at 2 AM:
```bash
0 2 * * * /home/ubuntu/backup.sh
```

### Step 10: Configure Firewall and Security

1. **Configure UFW firewall:**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000
sudo ufw status
```

2. **Set up automatic security updates:**
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Cost Estimation (per month)
- **e2-medium VM**: ~$25-30
- **20GB persistent disk**: ~$3
- **Network egress**: Variable based on traffic
- **Total**: ~$30-50/month

## Useful Commands

```bash
# Check application status
pm2 status
pm2 logs automation-app

# Restart application
pm2 restart automation-app

# Check system resources
htop
df -h
free -m

# Check MongoDB status
sudo systemctl status mongod
mongo --eval "db.adminCommand('listCollections')"

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# View application logs
tail -f logs/combined.log
```

## Troubleshooting

1. **Application won't start**: Check PM2 logs and environment variables
2. **Database connection issues**: Verify MongoDB is running and credentials are correct
3. **Nginx errors**: Check `/var/log/nginx/error.log`
4. **SSL certificate issues**: Run `sudo certbot certificates` to check status
5. **High memory usage**: Consider upgrading VM or optimizing application

## Maintenance Tasks

1. **Regular updates**: `sudo apt update && sudo apt upgrade`
2. **Monitor disk space**: `df -h`
3. **Check application logs**: `pm2 logs`
4. **Backup verification**: Test restore process monthly
5. **SSL certificate renewal**: Automatic with certbot
6. **Security patches**: Enabled with unattended-upgrades

## Final Notes
- Compute Engine gives you full control over the server environment
- Requires more maintenance than serverless options
- Better for applications with consistent traffic and specific requirements
- Consider setting up load balancing for high availability
- Monitor costs and optimize instance size based on usage
