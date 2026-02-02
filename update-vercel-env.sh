#!/bin/bash
# Script to update Vercel environment variables with Supabase URLs

echo "🔄 Updating Vercel environment variables..."

# Update DATABASE_URL for all environments
vercel env rm DATABASE_URL production -y
vercel env rm DATABASE_URL preview -y
vercel env rm DATABASE_URL development -y

echo 'postgresql://postgres.ocehfhrxrhymxcnwnobj:4JJYUAJTl6BNrIuQ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' | vercel env add DATABASE_URL production
echo 'postgresql://postgres.ocehfhrxrhymxcnwnobj:4JJYUAJTl6BNrIuQ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' | vercel env add DATABASE_URL preview
echo 'postgresql://postgres.ocehfhrxrhymxcnwnobj:4JJYUAJTl6BNrIuQ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' | vercel env add DATABASE_URL development

# Add DIRECT_URL for all environments
echo 'postgresql://postgres:4JJYUAJTl6BNrIuQ@db.ocehfhrxrhymxcnwnobj.supabase.co:5432/postgres' | vercel env add DIRECT_URL production
echo 'postgresql://postgres:4JJYUAJTl6BNrIuQ@db.ocehfhrxrhymxcnwnobj.supabase.co:5432/postgres' | vercel env add DIRECT_URL preview
echo 'postgresql://postgres:4JJYUAJTl6BNrIuQ@db.ocehfhrxrhymxcnwnobj.supabase.co:5432/postgres' | vercel env add DIRECT_URL development

echo "✅ Environment variables updated!"
echo "🚀 Triggering redeploy..."

# Trigger a new deployment
vercel --prod

echo "🎉 Done! Check your deployment at https://virtual-meet-ai-8pd1.vercel.app"
