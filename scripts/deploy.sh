#!/bin/bash

echo "🚀 EstZone Deploy to Railway"
echo "=============================="

# Check if there are any changes to commit
if git diff --quiet && git diff --staged --quiet; then
    echo "✅ No local changes to commit"
else
    echo "📦 Committing changes..."
    git add -A
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Push to GitHub (triggers Railway auto-deploy)
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🔄 Railway will automatically start deploying..."
    echo "📍 Your site: https://www.estzone.eu"
    echo ""
    echo "⏱️  Deploy usually takes 2-3 minutes."
    echo "   Refresh www.estzone.eu after a few minutes to see changes."
else
    echo ""
    echo "❌ Push failed. Please check your GitHub connection."
fi
