#!/bin/bash

# 1. Run the data update command
bun run update-data

# 2. Check for changes (including untracked files)
# --porcelain provides a stable, script-friendly output
IF_CHANGES=$(git status --porcelain)

if [ -n "$IF_CHANGES" ]; then
    echo "Changes detected. Committing and deploying..."
    
    # 3. Stage, commit, and push
    git add .
    git commit -m "chore: auto-update data $(date +'%Y-%m-%d %H:%M')"
    git push origin main  # Change 'main' to your branch name if different
    
    # 4. Run the deploy command
    bun run deploy
else
    echo "No changes detected. Skipping commit and deployment."
fi
