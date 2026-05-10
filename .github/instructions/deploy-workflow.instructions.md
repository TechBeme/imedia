---
description: "Deploy workflow rules for this project. Always follow these steps after making code changes."
applyTo: "**"
---

# Deploy Workflow

## Rule 1: Always commit and push to `master`

After completing any code change, bug fix, or feature:

1. Stage the changed files with `git add`
2. Commit with a descriptive message
3. Push to the **`master`** branch: `git push origin master`

**Do NOT push to other branches** (e.g., `phase/*`, `feature/*`, etc.) expecting the user to see the result. The user only monitors `master`.

## Rule 2: Always deploy to Vercel manually

After pushing to `master`, immediately run:

```bash
vercel --prod
```

**The GitHub repository is NOT automatically linked to Vercel.** Pushing to `master` does NOT trigger a deployment. You must run the Vercel CLI command manually every time.

## Rule 3: Confirm the deployment URL

After `vercel --prod` completes, report the production URL to the user.

## Summary

| Step | Command |
|------|---------|
| Commit | `git add <files> && git commit -m "..."` |
| Push | `git push origin master` |
| Deploy | `vercel --prod` |

Never skip the Vercel deploy step. Never push to branches other than `master` and assume the user will see it.
