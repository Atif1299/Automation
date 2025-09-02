# File Management System

## Overview

The enhanced file management system provides a production-ready solution for handling file uploads, downloads, organization, and maintenance in the admin-client automation system.

## Features

### 🗂️ Organized Storage
- **Year/Month Structure**: Files are automatically organized into `uploads/admin-files/YYYY/MM/` directories
- **Cloud-Ready**: Architecture supports future migration to AWS S3, Google Cloud Storage, etc.
- **Metadata Tracking**: Comprehensive file information stored in database

### 📁 File Operations
- **Smart Upload**: Automatic organization and metadata generation
- **Intelligent Download**: Multiple fallback search mechanisms for file location
- **Bulk Operations**: Download multiple files, cleanup utilities
- **File Validation**: Integrity checking and error detection

### 📊 Analytics & Monitoring
- **Download Tracking**: Monitor file access patterns
- **Usage Statistics**: Comprehensive reporting on file system health
- **Error Logging**: Detailed logging for troubleshooting

## Directory Structure

```
uploads/
├── admin-files/
│   ├── 2025/
│   │   ├── 01/          # January 2025 files
│   │   ├── 02/          # February 2025 files
│   │   └── ...
│   ├── 2026/
│   │   └── ...
│   └── legacy/          # Pre-migration files (if any)
```

## File Metadata Schema

Each uploaded file includes the following metadata:

```javascript
{
  fileName: String,           // Original filename
  originalName: String,       // User-provided filename
  fileSize: Number,          // File size in bytes
  uploadDate: Date,          // Upload timestamp
  relativePath: String,      // Path relative to uploads directory
  diskPath: String,          // Absolute path on disk
  downloadPath: String,      // URL path for downloads
  mimeType: String,          // File MIME type
  cloudProvider: String,     // Future: AWS, GCP, Azure
  cloudKey: String,          // Future: Cloud storage key
  analytics: {
    downloads: Number,       // Download count
    lastDownloaded: Date     // Last download timestamp
  }
}
```

## API Endpoints

### File Upload
```
POST /admin/client/:clientId/upload
- Accepts multipart/form-data
- Automatically organizes files by date
- Returns file metadata
```

### File Download
```
GET /admin/download/:clientId/:fileName
- Intelligent file location search
- Analytics tracking
- Secure access control
```

### Bulk Download
```
GET /admin/download/:clientId/all
- Downloads all client files as ZIP
- Preserves original filenames
- Efficient streaming
```

### File Management
```
POST /admin/api/cleanup-files       # Remove orphaned files
GET  /admin/api/file-statistics     # System statistics
POST /admin/api/migrate-legacy      # Migrate old files
```

## Management Scripts

### Migration Script
Migrates existing files to the new organized structure:

```bash
npm run migrate-files
```

**Features:**
- Moves files from flat structure to year/month organization
- Updates database records with correct paths
- Preserves file integrity
- Detailed migration report

### Validation Script
Validates file system integrity:

```bash
npm run validate-files
```

**Checks:**
- Database vs. disk file consistency
- Orphaned files detection
- Duplicate file identification
- File size validation
- Health score calculation

### Cleanup Script
Removes orphaned and unnecessary files:

```bash
npm run cleanup-files
```

**Operations:**
- Removes files not referenced in database
- Cleans up empty directories
- Generates cleanup report

### Statistics Script
Generates comprehensive file system statistics:

```bash
npm run file-stats
```

**Reports:**
- Total files and storage usage
- Upload trends by month/year
- Download analytics
- Client file distribution

## Cloud Migration Preparation

The system is designed for easy cloud migration:

### AWS S3 Integration (Future)
```javascript
// Environment variables for AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Google Cloud Storage (Future)
```javascript
// Environment variables for GCP
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_KEYFILE=path/to/keyfile.json
GOOGLE_CLOUD_BUCKET=your-bucket-name
```

## Security Features

### Access Control
- JWT-based authentication for all file operations
- Client-specific file isolation
- Admin-only management endpoints

### Content Security
- MIME type validation
- File size limits
- Secure filename handling
- Path traversal protection

### Audit Trail
- Complete download history
- User access logging
- Error tracking and reporting

## Performance Optimizations

### Streaming Downloads
- Large files streamed directly from disk
- Memory-efficient processing
- Proper HTTP headers for caching

### Database Optimization
- Indexed file queries
- Efficient bulk operations
- Optimized search algorithms

### Storage Efficiency
- Automatic cleanup of orphaned files
- Compression for archive downloads
- Efficient directory organization

## Monitoring & Maintenance

### Health Checks
- Automated file system validation
- Database consistency checks
- Storage capacity monitoring

### Error Handling
- Comprehensive error logging
- Graceful failure recovery
- User-friendly error messages

### Backup Considerations
- Organized structure simplifies backups
- Database metadata backup essential
- Cloud storage provides redundancy

## Troubleshooting

### Common Issues

**File Not Found Errors:**
1. Run validation script: `npm run validate-files`
2. Check file paths in database vs. disk
3. Run migration if needed: `npm run migrate-files`

**Upload Failures:**
1. Check disk space availability
2. Verify directory permissions
3. Check file size limits in configuration

**Download Issues:**
1. Verify client authentication
2. Check file existence with validation script
3. Review server logs for detailed errors

**Performance Issues:**
1. Run cleanup script: `npm run cleanup-files`
2. Check database indexes
3. Monitor server resources

### Log Locations
- Application logs: Console output or configured log files
- Error logs: Captured in database and console
- Access logs: Part of analytics tracking

## Development Notes

### Adding New Features
1. Update file schema in `models/Client.js`
2. Modify upload routes in `routes/admin.js`
3. Update frontend forms and scripts
4. Test with validation script

### Testing
1. Upload test files of various types and sizes
2. Run validation script to verify integrity
3. Test download functionality
4. Verify cleanup operations

### Deployment
1. Set up organized directory structure
2. Run migration script for existing files
3. Configure environment variables
4. Set up monitoring and backup procedures

---

*This file management system provides a robust, scalable solution for handling files in the admin-client automation system, with built-in support for future cloud migration and comprehensive monitoring capabilities.*
