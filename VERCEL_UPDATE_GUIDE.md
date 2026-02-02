# Vercel Environment Variables Update Guide

## Quick Steps

### 1. Open Vercel Settings
Go to: https://vercel.com/mayanks-projects-b76010dd/virtual-meet-ai-8pd1/settings/environment-variables

### 2. Update DATABASE_URL

- Search for: `DATABASE_URL`
- Click menu (•••) → Edit
- Replace value with:
```
postgresql://postgres.ocehfhrxrhymxcnwnobj:4JJYUAJTl6BNrIuQ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```
- Click Save

### 3. Add DIRECT_URL

- Click "Add Environment Variable" button
- Key: `DIRECT_URL`
- Value:
```
postgresql://postgres:4JJYUAJTl6BNrIuQ@db.ocehfhrxrhymxcnwnobj.supabase.co:5432/postgres
```
- Select: "All Environments" (Production, Preview, Development)
- Click Save

### 4. Redeploy

Vercel will automatically trigger a new deployment. If not:
- Go to Deployments tab
- Click "Redeploy" on the latest deployment

## What This Fixes

✅ Resolves the `agentActive` column error  
✅ Connects production to Supabase database  
✅ Enables proper database migrations on deployment  

## Verification

After deployment completes, visit:
- https://virtual-meet-ai-8pd1.vercel.app/meetings
- https://virtual-meet-ai-8pd1.vercel.app/agents

Both pages should load without errors!
