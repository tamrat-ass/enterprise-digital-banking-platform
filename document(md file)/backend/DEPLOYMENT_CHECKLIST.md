# Deployment Checklist: Backend Optimization Fixes

## Pre-Deployment Preparation

### Understanding the Changes (15 min)
- [ ] Read `00_START_HERE.md` - Quick overview
- [ ] Understand root cause of "too many clients" error
- [ ] Review expected performance improvements
- [ ] Confirm team alignment on deployment

### Code Review (20 min)
- [ ] Review changes in `lib/db/index.ts`
- [ ] Review changes in `lib/auth.ts`
- [ ] Review changes in `lib/session.ts`
- [ ] Review changes in `app/api/users/route.ts`
- [ ] Verify all changes are backward compatible
- [ ] Check for any syntax errors in modified files

### Environment Preparation (10 min)
- [ ] Prepare environment variables for deployment
- [ ] Document current database configuration
- [ ] Ensure `.env.local` or deployment platform ready
- [ ] Verify PostgreSQL connection accessible
- [ ] Have rollback procedure ready

---

## Local Testing (30 minutes)

### Build & Compilation
- [ ] Run `npm install` to ensure dependencies up to date
- [ ] Run `npm run build` successfully
- [ ] Verify no TypeScript compilation errors
- [ ] Verify no ESLint errors

### Local Execution
- [ ] Start dev server: `npm run dev`
- [ ] Dev server starts without errors
- [ ] Can access http://localhost:3000 successfully
- [ ] Database connection works (no connection errors in logs)

### Endpoint Testing
- [ ] Test `/api/users` endpoint
  ```bash
  curl -i http://localhost:3000/api/users
  ```
- [ ] Endpoint responds with status 200 (or 401 if auth required)
- [ ] Response time < 200ms
- [ ] No database errors in logs

### Database Validation
- [ ] Check connection pool: 
  ```sql
  SELECT count(*) FROM pg_stat_activity;
  ```
- [ ] Connection count < 15 (well within 30 limit)
- [ ] No "too many clients" errors in database logs
- [ ] No idle transactions accumulating

### Performance Verification
- [ ] Page loads complete successfully
- [ ] No timeout errors in browser console
- [ ] No connection refused errors
- [ ] Response times feel snappy

### Logging Review
- [ ] Review application logs for warnings
- [ ] No error messages related to connections
- [ ] Database queries log looks normal
- [ ] No panic or critical messages

---

## Staging Deployment (1 hour)

### Pre-Deployment
- [ ] Notify team of staging deployment
- [ ] Backup staging database (if possible)
- [ ] Have rollback procedure available
- [ ] Clear staging logs for clean baseline

### Deployment
- [ ] Push code to staging branch
- [ ] Deploy to staging environment
- [ ] Verify deployment successful (no errors)
- [ ] Confirm environment variables set correctly
- [ ] Dev server/application starts cleanly

### Post-Deployment Validation (10 min)
- [ ] Check database connection count:
  ```sql
  SELECT count(*) FROM pg_stat_activity;
  ```
  Expected: 15-25 connections
  
- [ ] Check connection breakdown:
  ```sql
  SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
  ```
  Expected: Mostly "active" or "idle", minimal "idle in transaction"

- [ ] Test critical endpoints:
  - [ ] GET `/api/users` - response < 200ms
  - [ ] GET `/api/me` or current user endpoint - response < 100ms
  - [ ] POST user/login flow - works smoothly
  - [ ] Page load - completes < 2 seconds

### Monitoring (30 minutes)
- [ ] Monitor connection pool every 5 minutes
- [ ] Watch error logs for any issues
- [ ] Check response times (should be faster)
- [ ] Verify no "too many clients" errors
- [ ] Test with simulated load if possible

### Team Testing
- [ ] Have QA test typical user workflows
- [ ] Verify no broken functionality
- [ ] Confirm performance improvements visible
- [ ] Gather feedback from team

---

## Production Deployment (1-2 hours)

### Final Preparation
- [ ] Confirm staging validation successful
- [ ] Notify stakeholders of production deployment
- [ ] Backup production database
- [ ] Ensure rollback plan documented
- [ ] Have team available for monitoring

### Deployment Window
- [ ] Schedule during low-traffic time if possible
- [ ] Deploy code to production
- [ ] Verify deployment successful
- [ ] Confirm environment variables set in production
- [ ] Verify application starts cleanly

### Post-Deployment Verification (First Hour)
- [ ] Monitor connection pool every minute:
  ```sql
  SELECT count(*) FROM pg_stat_activity;
  ```
  Should stay 15-25, never exceed 28/30

- [ ] Monitor error logs:
  ```bash
  grep -i "too many clients\|connection refused\|connection timeout" logs/app.log
  ```
  Should see zero errors

- [ ] Test critical user workflows:
  - [ ] Login/authentication works
  - [ ] Dashboard loads (< 2 seconds)
  - [ ] Users list loads (< 500ms)
  - [ ] Document operations work
  - [ ] No timeout messages

- [ ] Check response times:
  ```bash
  # Test a few endpoints
  curl -w "Time: %{time_total}s\n" https://production/api/users
  ```
  Should be much faster than before

- [ ] Verify database query performance:
  ```sql
  SELECT query, mean_time, calls FROM pg_stat_statements 
  WHERE calls > 10 
  ORDER BY calls DESC LIMIT 10;
  ```
  Should show fewer queries, faster times

### Extended Monitoring (Next 2-4 Hours)
- [ ] Monitor every 15 minutes for first 2 hours
- [ ] Watch for patterns in connection pool usage
- [ ] Check for any error spikes
- [ ] Monitor user feedback (Slack, support tickets)

### End of Day Verification
- [ ] No incidents reported
- [ ] Error rate stable and low (< 1%)
- [ ] Connection pool healthy
- [ ] Performance metrics show improvement
- [ ] Users report no issues

---

## Rollback Procedure (If Needed)

### Decision Point
If ANY of these occur, proceed to rollback:
- [ ] Continuous "too many clients" errors (after 15 min)
- [ ] Application crashes or won't start
- [ ] Database connection failures
- [ ] Performance worse than before
- [ ] Critical errors in production logs

### Rollback Steps (< 15 minutes)
```bash
# 1. Identify the commit hash
git log --oneline | head

# 2. Revert the changes
git revert <commit-hash>

# 3. Rebuild and redeploy
npm run build
# Deploy using your platform

# 4. Verify rollback successful
curl http://production-url/health
```

### Post-Rollback
- [ ] Verify application stable
- [ ] Check database connections normal
- [ ] Test critical endpoints work
- [ ] Notify team of rollback
- [ ] Plan for re-deployment

### What NOT to do on Rollback
- ❌ Don't use `git reset --hard` (harder to track)
- ❌ Don't manually revert files (easy mistakes)
- ❌ Don't skip verification steps
- ❌ Don't deploy partially

---

## Success Criteria (Post-Deployment)

### Must Have
- [ ] ✅ No "too many clients already" errors in logs
- [ ] ✅ No "connection refused" errors in logs
- [ ] ✅ No "connection timeout" errors in logs
- [ ] ✅ Database connections stable (15-25/30)
- [ ] ✅ All critical user flows working
- [ ] ✅ Error rate < 1%

### Should Have
- [ ] ✅ Page load time improved 50%+
- [ ] ✅ API response times improved 50%+
- [ ] ✅ Users report faster experience
- [ ] ✅ Database query count reduced
- [ ] ✅ No performance regressions

### Nice to Have
- [ ] ✅ Better user satisfaction
- [ ] ✅ Fewer support tickets about timeouts
- [ ] ✅ Smoother system under load
- [ ] ✅ Team confidence in system reliability

---

## Monitoring After Deployment

### Daily (First Week)
- [ ] Check connection pool health
- [ ] Review error logs for patterns
- [ ] Verify performance metrics
- [ ] Check user feedback

### Weekly (First Month)
- [ ] Review database metrics
- [ ] Check for performance trends
- [ ] Verify error rate remains low
- [ ] Compare before/after metrics

### Monthly (Ongoing)
- [ ] Monitor connection pool usage
- [ ] Track performance trends
- [ ] Ensure configuration still appropriate
- [ ] Plan for any adjustments needed

### Metrics to Track

```sql
-- Connection pool health
SELECT count(*) FROM pg_stat_activity;

-- Connection breakdown
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- Slow queries (> 1 second)
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC;

-- Overall query performance
SELECT sum(mean_time * calls) as total_time,
       sum(calls) as total_calls,
       sum(mean_time * calls) / sum(calls) as avg_time
FROM pg_stat_statements;
```

---

## Documentation & Knowledge Transfer

### Before Deployment
- [ ] Team reads `00_START_HERE.md`
- [ ] Team reviews `DEPLOYMENT_README.md`
- [ ] Team familiar with rollback procedure
- [ ] Team knows who to contact if issues

### After Deployment
- [ ] Document actual deployment time and steps taken
- [ ] Update runbooks with new configuration
- [ ] Share performance improvement metrics with team
- [ ] Archive deployment logs for reference
- [ ] Add lessons learned to team wiki

### Ongoing
- [ ] Team can explain the fix to others
- [ ] New team members get overview in onboarding
- [ ] Maintenance runbook includes connection pool info
- [ ] Keep documentation up to date

---

## Configuration Management

### Development
```dotenv
DB_POOL_MAX=15
DB_IDLE_TIMEOUT=20
DB_CONNECT_TIMEOUT=5
DB_AUTH_POOL_MAX=5
```

### Staging
```dotenv
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30
DB_CONNECT_TIMEOUT=10
DB_AUTH_POOL_MAX=10
```

### Production (Current)
```dotenv
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30
DB_CONNECT_TIMEOUT=10
DB_AUTH_POOL_MAX=10
```

### Production (High Traffic - If Needed)
```dotenv
DB_POOL_MAX=40
DB_IDLE_TIMEOUT=45
DB_CONNECT_TIMEOUT=15
DB_AUTH_POOL_MAX=15
```

---

## Troubleshooting During Deployment

### Issue: Build Fails with TypeScript Errors
**Solution**: 
- [ ] Verify all files modified correctly
- [ ] Run `npm install` to update dependencies
- [ ] Clear `.next` cache and rebuild
- [ ] Check for merge conflicts

### Issue: Application Won't Start
**Solution**:
- [ ] Check environment variables are set
- [ ] Verify DATABASE_URL is correct
- [ ] Check PostgreSQL is running and accessible
- [ ] Review application logs for specific errors

### Issue: Database Connection Fails
**Solution**:
- [ ] Verify DATABASE_URL format
- [ ] Confirm PostgreSQL credentials correct
- [ ] Verify firewall allows connection
- [ ] Check PostgreSQL server is running
- [ ] Review PostgreSQL error logs

### Issue: Still Seeing "Too Many Clients" Errors
**Solution**:
- [ ] Verify environment variables deployed correctly
- [ ] Check code changes deployed (review git log)
- [ ] Confirm pool configuration active (check app logs)
- [ ] Look for connection leaks in database
- [ ] May need to increase pool sizes further

### Issue: Performance Didn't Improve
**Solution**:
- [ ] Verify query changes deployed
- [ ] Check React cache() is actually being used
- [ ] Review database query logs to confirm optimization
- [ ] Look for other N+1 patterns not yet fixed
- [ ] May be other bottlenecks (check response times)

### Issue: Errors in Application Logs
**Solution**:
- [ ] Review specific error message
- [ ] Check if it's related to this deployment
- [ ] Verify database schema matches expectations
- [ ] Check for other recent changes that might conflict
- [ ] Review rollback procedure if critical

---

## Sign-Off

### Pre-Deployment
- [ ] Code changes reviewed
- [ ] Testing completed successfully
- [ ] Team alignment confirmed
- [ ] Deployment plan agreed
- [ ] Rollback procedure documented

### Post-Deployment
- [ ] Deployment completed successfully
- [ ] Monitoring verified stable
- [ ] Success criteria met
- [ ] Team notified
- [ ] Documentation updated

### Signed By
- **Engineer**: ___________________ Date: ______
- **Tech Lead**: ___________________ Date: ______
- **DevOps/Ops**: ___________________ Date: ______

---

## Quick Reference

**Deployment Steps**:
1. Code review ✓
2. Local testing ✓
3. Staging deployment ✓
4. Staging verification ✓
5. Production deployment →
6. Production verification →
7. Monitoring →
8. Success confirmation ✓

**Verify Connection Pool**:
```sql
SELECT count(*) FROM pg_stat_activity;  -- Should be 15-25/30
```

**Check for Errors**:
```bash
grep "too many clients\|connection refused" logs/app.log  -- Should be empty
```

**Test Endpoint Performance**:
```bash
curl -w "Time: %{time_total}s\n" http://localhost/api/users  -- Should be <200ms
```

**Rollback Command**:
```bash
git revert <commit-hash> && npm run build  # If needed
```

---

**Deployment Status**: ⬜ Ready to Deploy

*Last Updated: July 2026*
*Next Review: After Production Deployment*
