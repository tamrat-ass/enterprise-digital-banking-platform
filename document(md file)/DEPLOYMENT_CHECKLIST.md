# 🚀 Deployment Checklist

Complete checklist for deploying the Enterprise Digital Banking Governance Platform to production.

## Pre-Deployment (1-2 weeks before)

### Planning & Communication

- [ ] Schedule deployment window
- [ ] Notify stakeholders
- [ ] Plan rollback procedure
- [ ] Prepare communication plan
- [ ] Assign on-call support staff
- [ ] Document known issues

### Code Review & Testing

- [ ] Complete code review
- [ ] Pass all unit tests
- [ ] Pass integration tests
- [ ] Security scan completed
- [ ] Performance testing done
- [ ] Load testing if applicable
- [ ] UAT completed
- [ ] Accessibility audit passed

### Documentation

- [ ] API documentation updated
- [ ] Setup guide reviewed
- [ ] Architecture diagrams current
- [ ] Runbooks prepared
- [ ] Rollback procedures documented
- [ ] Support procedures updated

## Environment Setup (3-5 days before)

### Infrastructure

- [ ] Production database provisioned
- [ ] Database backups configured
- [ ] Server resources allocated
- [ ] Load balancer configured
- [ ] SSL/TLS certificates ready
- [ ] CDN configured (if applicable)
- [ ] Monitoring alerts configured
- [ ] Logging configured
- [ ] Email service configured

### Security

- [ ] Security credentials generated
- [ ] Secrets stored in vault
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting configured
- [ ] WAF rules configured
- [ ] IP whitelisting reviewed
- [ ] API keys rotated
- [ ] Database encryption verified

### Configuration

- [ ] Environment variables set
  ```bash
  NODE_ENV=production
  DATABASE_URL=postgresql://...
  BETTER_AUTH_SECRET=<strong-secret>
  BETTER_AUTH_URL=https://your-domain.com
  ```
- [ ] Database pool settings optimized
- [ ] Caching configured
- [ ] Logging level set to production
- [ ] Error reporting configured
- [ ] Monitoring dashboards ready

## Database Preparation (1-2 days before)

### Schema & Data

- [ ] All migrations applied to staging
- [ ] Schema verified in staging
- [ ] Backup tested successfully
- [ ] Seed data prepared (if needed)
- [ ] Data migration scripts tested
- [ ] Indexes optimized
- [ ] Statistics updated

### Backup & Recovery

- [ ] Full database backup created
- [ ] Backup tested for restorability
- [ ] Point-in-time recovery tested
- [ ] Backup location verified
- [ ] Disaster recovery plan reviewed

## Testing Phase (Final week)

### Staging Environment

- [ ] Staging deployment successful
- [ ] Smoke tests passed
- [ ] Integration tests passed
- [ ] Performance tests passed
- [ ] Security tests passed
- [ ] Load tests passed (if applicable)
- [ ] Regression tests passed

### User Acceptance Testing

- [ ] Business users tested functionality
- [ ] No critical issues found
- [ ] Minor issues documented for post-launch
- [ ] Sign-off obtained

### Performance Testing

- [ ] Response times acceptable
- [ ] Database query performance verified
- [ ] Memory usage normal
- [ ] CPU usage normal
- [ ] Network bandwidth adequate

## Deployment Day

### Pre-Deployment (30 minutes before)

- [ ] Team assembled and briefed
- [ ] Communication channels open
- [ ] Monitoring dashboards visible
- [ ] Rollback procedure reviewed
- [ ] Database backups current
- [ ] Deployment scripts tested
- [ ] All systems green

### Deployment Steps

#### 1. Backup Current System

```bash
# Production database backup
pg_dump -Fc production_url > backup-$(date +%Y%m%d-%H%M%S).dump

# Application state backup (if stateful)
# Deploy package backup
```

- [ ] Backup completed successfully
- [ ] Backup verified and stored

#### 2. Deploy Application

```bash
# Pull latest code
git fetch origin
git checkout main
git pull origin main

# Install dependencies
pnpm install

# Build
pnpm build

# Run migrations
DATABASE_URL=production_url pnpm db:migrate

# Start service
npm start
```

- [ ] Code pulled
- [ ] Build successful
- [ ] Migrations applied
- [ ] Service started
- [ ] No startup errors

#### 3. Verify Deployment

```bash
# Health check
curl https://your-domain.com/api/health

# Check logs
tail -f /var/log/app/production.log

# Monitor metrics
# Check CPU, memory, database connections
```

- [ ] API responding
- [ ] No errors in logs
- [ ] Database connected
- [ ] Authentication working
- [ ] Key endpoints tested

#### 4. Smoke Tests

```bash
# Run smoke test suite
npm run test:smoke

# OR manual checks:
```

- [ ] User can sign in
- [ ] Documents list loads
- [ ] Can create document
- [ ] Approvals work
- [ ] Projects display
- [ ] Dashboard metrics correct
- [ ] Audit logs recording

- [ ] All smoke tests passed
- [ ] No errors or warnings

#### 5. Monitor for 15-30 minutes

- [ ] Error rate normal
- [ ] Response time acceptable
- [ ] Database performing well
- [ ] No memory leaks
- [ ] Logs clean
- [ ] Users reporting success

### If Issues Arise

#### Minor Issues (non-blocking)

- [ ] Document issue
- [ ] Continue monitoring
- [ ] Fix in next release
- [ ] Notify stakeholders

#### Major Issues (blocking)

- [ ] Initiate rollback
- [ ] See "Rollback Procedure" below
- [ ] Assess root cause
- [ ] Plan fix
- [ ] Communicate with users

## Post-Deployment (First 24 hours)

### Immediate After (First hour)

- [ ] Continued monitoring
- [ ] No critical errors
- [ ] User feedback positive
- [ ] Performance metrics good
- [ ] Database healthy

### Next 24 Hours

- [ ] Monitor error rates
- [ ] Check performance trends
- [ ] Review user feedback
- [ ] Database backup completed
- [ ] Logs reviewed
- [ ] Document any issues
- [ ] Update status dashboard

### First Week

- [ ] Stability verified
- [ ] Performance optimized if needed
- [ ] Issues from UAT fixed
- [ ] Documentation updated
- [ ] Knowledge transfer complete
- [ ] Support team trained

## Rollback Procedure

**Only use if deployment is failing or causing critical issues**

### Quick Rollback (< 15 minutes)

```bash
# Stop current service
systemctl stop meridian

# Restore database from backup
pg_restore -d meridian backup-$(date +%Y%m%d).dump

# Deploy previous version
git checkout main~1
pnpm install
pnpm build
npm start

# Verify
curl https://your-domain.com/api/health
```

**Rollback Checklist:**

- [ ] Database backup location confirmed
- [ ] Previous version tag known
- [ ] Service stop successful
- [ ] Database restore completed
- [ ] Application started
- [ ] Health check passed
- [ ] Smoke tests passed
- [ ] Notify stakeholders

### Decision Matrix

| Scenario | Action |
|----------|--------|
| API not responding | Rollback immediately |
| Database errors | Rollback immediately |
| > 5% error rate | Rollback immediately |
| Performance degraded > 50% | Rollback immediately |
| Minor UI bug | Do NOT rollback, fix in next release |
| Single feature broken | Assess - might rollback or fix forward |

## Post-Deployment Monitoring (Ongoing)

### Daily Checks

- [ ] Error rate < 0.1%
- [ ] Response time < 500ms
- [ ] Database connections healthy
- [ ] Disk space adequate
- [ ] Memory usage normal
- [ ] No security alerts
- [ ] Backups completed

### Weekly Checks

- [ ] Review error logs
- [ ] Performance trends normal
- [ ] User feedback positive
- [ ] Security scan passed
- [ ] Database optimization reviewed

### Monthly Checks

- [ ] Full system audit
- [ ] Capacity planning review
- [ ] Cost optimization review
- [ ] Security assessment
- [ ] Performance optimization

## Monitoring Dashboard Setup

### Key Metrics to Track

```
Application:
- Request rate (req/sec)
- Error rate (%)
- Response time (ms)
- Active users
- CPU usage (%)
- Memory usage (%)

Database:
- Connection count
- Query time (ms)
- Slow queries
- Replication lag (if applicable)
- Disk I/O
- Cache hit ratio

Infrastructure:
- Disk usage (%)
- Network I/O
- Uptime (%)
- Certificate expiry
```

### Alert Thresholds

| Metric | Alert | Critical |
|--------|-------|----------|
| Error Rate | > 0.5% | > 2% |
| Response Time | > 1s | > 3s |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 80% | > 95% |
| Disk Usage | > 80% | > 95% |
| Database Connections | > 80 | > 100 |

## Support & On-Call

### On-Call Responsibilities

- [ ] Monitor alerts
- [ ] Respond to critical issues
- [ ] Escalate as needed
- [ ] Communicate with users
- [ ] Document incidents

### Escalation Path

1. On-call engineer
2. Team lead
3. Operations manager
4. VP Engineering

### Communication Templates

**For Users (Outage):**
```
We are currently experiencing issues with [service].
Our team is investigating. Estimated resolution: [time].
We apologize for the inconvenience.
```

**For Stakeholders (Post-Incident):**
```
Incident Report: [Service] Outage - [Date/Time]
Duration: [X minutes]
Root Cause: [Cause]
Resolution: [What we did]
Prevention: [What we'll do to prevent]
```

## Sign-Off

### Deployment Lead

- Name: _______________
- Date: ________________
- Signature: ___________
- Time: ________________

### Operations Lead

- Name: _______________
- Date: ________________
- Signature: ___________
- Time: ________________

### Project Manager

- Name: _______________
- Date: ________________
- Signature: ___________
- Time: ________________

## Incident Log

| Time | Issue | Action | Resolution | Notes |
|------|-------|--------|-----------|-------|
| | | | | |
| | | | | |

## Post-Deployment Review

**Schedule:** 48 hours after deployment

### Topics

- [ ] Deployment went smoothly
- [ ] No critical issues
- [ ] Lessons learned
- [ ] Process improvements
- [ ] Documentation updates needed

### Attendees

- [ ] Deployment lead
- [ ] Operations
- [ ] Engineering
- [ ] Product

## Deployment History

| Version | Date | Environment | Status | Notes |
|---------|------|-------------|--------|-------|
| 1.0.0 | | Production | | |

---

## Quick Reference

### Deployment Command

```bash
# Full deployment
git pull origin main && \
pnpm install && \
pnpm build && \
DATABASE_URL=production pnpm db:migrate && \
npm start
```

### Monitoring Command

```bash
# Watch logs
tail -f /var/log/app/production.log

# Check health
curl https://your-domain.com/api/health

# Database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### Rollback Command

```bash
# Restore from backup
git checkout main~1 && \
npm install && npm build && npm start && \
pg_restore -d meridian backup.dump
```

### Database Backup Command

```bash
# Quick backup
pg_dump -Fc $(echo $DATABASE_URL | sed 's/^..*\///' ) > backup-$(date +%Y%m%d-%H%M%S).dump
```

---

**Created:** February 2024
**Last Updated:** February 2024
**Version:** 1.0.0

For questions or issues, contact the deployment team.
