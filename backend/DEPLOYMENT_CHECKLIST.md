# 🚀 Deployment Checklist - Dexter Reptiles Project

## ⚠️ CRITICAL - MUST COMPLETE BEFORE DEPLOY

### 1. **JWT SECRET UPDATE** 🚨
```bash
# Generate new secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64')"

# Update .env file
JWT_SECRET="your-new-64-character-random-secret-here"
```

### 2. **Environment Variables** 🚨
```bash
# Verify all required variables are set
DATABASE_URL="postgresql://user:strong_password@host:5432/db"
JWT_SECRET="64-char-random-string"
PORT=5000
ADMIN_URL="https://your-admin-domain.com"
WEB_URL="https://your-website-domain.com"
```

## ✅ Pre-Deployment Tests

### Backend Tests
```bash
# 1. Build the project
npm run build

# 2. Test image optimization
node test-image-optimization.js

# 3. Start development server
npm run dev

# 4. Test health endpoint
curl http://localhost:5000/api/health

# 5. Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### Frontend Tests
```bash
# 1. Admin Panel
cd frontend
npm run dev
# Test: http://localhost:5173

# 2. Customer Website  
cd webpage
npm run dev
# Test: http://localhost:5174
```

## 🔍 Functionality Checklist

### ✅ Core Features
- [ ] Admin login works
- [ ] Customer login works
- [ ] Snake management (CRUD)
- [ ] Order management
- [ ] Payment slip upload
- [ ] Snake image upload
- [ ] Dashboard statistics
- [ ] Settings management
- [ ] Customer registration

### ✅ Image Optimization
- [ ] Snake images optimize correctly
- [ ] Payment slips optimize correctly
- [ ] WebP conversion works
- [ ] File size limits enforced
- [ ] Original files deleted
- [ ] Error handling works

### ✅ TikTok Integration
- [ ] TikTok URLs display correctly
- [ ] Videos embed properly
- [ ] No black borders
- [ ] No related videos
- [ ] Scroll prevention works

### ✅ Security
- [ ] JWT authentication works
- [ ] Role-based access control
- [ ] File upload validation
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] Error handling

## 📊 Performance Tests

### Upload Performance
```bash
# Test with various image sizes
# Small (< 1MB)
# Medium (1-5MB) 
# Large (> 5MB)

# Expected behavior:
# - All images optimize to < 500KB
# - Processing time < 2 seconds per image
# - Concurrent uploads work
```

### API Performance
```bash
# Test response times
# Health check: < 100ms
# Authentication: < 500ms
# Data queries: < 1 second
# File uploads: < 2 seconds
```

## 🛡️ Security Verification

### Authentication
```bash
# Test invalid tokens
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:5000/api/snakes

# Should return 401
```

### File Upload Security
```bash
# Test invalid file types
curl -X POST http://localhost:5000/api/snakes/upload \
  -H "Authorization: Bearer valid-token" \
  -F "image=@malicious-file.exe"

# Should return 400 error
```

### CORS Testing
```bash
# Test from unauthorized domain
# Should be blocked by CORS policy
```

## 📱 Frontend Integration

### Admin Panel (Frontend)
```bash
cd frontend
npm run build
# Test all features:
# - Login/logout
# - Snake management
# - Order processing
# - Image uploads
# - Settings
```

### Customer Website (Webpage)
```bash
cd webpage
npm run build
# Test all features:
# - Registration/login
# - Product browsing
# - Cart functionality
# - Checkout
# - Order tracking
```

## 🗄️ Database Checks

### Connection Test
```bash
# Verify database connection
# Test all CRUD operations
# Check data integrity
# Verify relationships
```

### Backup Verification
```bash
# Ensure recent backup exists
# Test backup restoration
# Verify backup schedule
```

## 📁 File System

### Upload Directories
```bash
# Verify directories exist
uploads/
├── slips/
├── snakes/
│   ├── admin/
│   └── customer/
```

### Permissions
```bash
# Verify write permissions
# Test file creation
# Check cleanup works
```

## 🚀 Production Deployment Steps

### 1. Environment Setup
```bash
# Set production environment
NODE_ENV=production

# Update all secrets
# Verify database connection
# Check SSL certificates
```

### 2. Build & Deploy
```bash
# Backend
cd backend
npm run build
npm start

# Frontend (Admin)
cd frontend
npm run build
# Deploy to admin domain

# Frontend (Customer)  
cd webpage
npm run build
# Deploy to main domain
```

### 3. Post-Deployment Verification
```bash
# Test all endpoints
# Verify authentication
# Test file uploads
# Check performance
# Monitor error logs
```

## 📊 Monitoring Setup

### Logs
```bash
# Application logs
# Error logs
# Access logs
# Performance metrics
```

### Alerts
```bash
# Server downtime
# High error rates
# Performance issues
# Security events
```

## 🔄 Rollback Plan

### If Issues Occur
1. **Database**: Restore from backup
2. **Code**: Revert to previous commit
3. **Environment**: Restore .env file
4. **Files**: Clear upload directory if corrupted

### Rollback Commands
```bash
# Git rollback
git checkout previous-commit-tag

# Database restore
psql -h host -U user -d db < backup.sql

# Clear uploads
rm -rf uploads/*
mkdir -p uploads/{slips,snakes/{admin,customer}}
```

## 📞 Emergency Contacts

### Team Contacts
- **Developer**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Server Admin**: [Contact Info]
- **Client**: [Contact Info]

### Emergency Procedures
1. **Security Issue**: Change all secrets immediately
2. **Data Loss**: Restore from latest backup
3. **Performance**: Scale resources or rollback
4. **Downtime**: Check logs and restart services

## ✅ Final Sign-off

### Before Going Live
- [ ] JWT secret updated
- [ ] All tests passed
- [ ] Security verified
- [ ] Performance acceptable
- [ ] Backup confirmed
- [ ] Monitoring setup
- [ ] Team notified
- [ ] Client approved

### Post-Launch
- [ ] Monitor first 24 hours
- [ ] Check error rates
- [ ] Verify user experience
- [ ] Document any issues
- [ ] Plan improvements

---

**Status**: 🟡 Ready for deployment after JWT secret update
**Last Updated**: $(date)
**Next Review**: 7 days post-deployment
