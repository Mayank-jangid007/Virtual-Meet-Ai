#!/bin/bash
# Script to resolve migration conflicts and apply pending migrations

echo "🔍 Checking current migration status..."

# First, let's see what migrations are pending
npx prisma migrate status

echo ""
echo "📝 Marking conflicting migrations as resolved..."

# Mark the migrations that are already partially applied
npx prisma migrate resolve --applied 20260113064915_init
npx prisma migrate resolve --applied 20260113104811_init

echo ""
echo "✅ Deploying remaining migrations..."

# Now deploy the remaining migrations (including the agentActive one)
npx prisma migrate deploy

echo ""
echo "🎉 Migration complete! Checking final status..."
npx prisma migrate status
