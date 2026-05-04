# Research: X API v2

**Date:** 2026-05-04
**Source:** Official X Developer Platform documentation

## Overview

X API v2 provides endpoints for creating posts (tweets), uploading media, and retrieving analytics. OAuth 2.0 required for write operations.

## Authentication

### OAuth 2.0
- Authorization Code with PKCE (user context)
- Client Credentials (app context — read-only)
- Scopes:
  - `tweet.read` — read tweets
  - `tweet.write` — create tweets
  - `tweet.moderate.write` — hide/unhide replies
  - `users.read` — read user info
  - `offline.access` — refresh tokens
  - `media.write` — upload media

## Post Operations

### Create Post
- Endpoint: `POST https://api.x.com/2/tweets`
- Body: `{ "text": "...", "media": { "media_ids": ["..."] } }`
- Supports polls, replies, quotes, retweets
- Max 280 characters (4,000 for Twitter Blue / verified organizations)

### Media Upload
- Endpoint: `POST https://api.x.com/2/media/upload`
- Chunked upload for large files (INIT, APPEND, FINALIZE)
- Supports images (PNG, JPG, GIF, WebP), videos (MP4, MOV), GIFs
- Image: max 5MB, Video: max 512MB (chunked), max 140 seconds

### List Tweets
- Endpoint: `GET https://api.x.com/2/users/:id/tweets`
- Supports pagination, expansions, tweet fields

### Delete Tweet
- Endpoint: `DELETE https://api.x.com/2/tweets/:id`

## Analytics

- X Analytics API (separate, limited access)
- Metrics: impressions, engagements, retweets, replies, likes, quotes
- Requires elevated access tier

## Rate Limits

- `POST /2/tweets`: 200 per 15 min (user), 300 per 3 hours (app)
- `POST /2/media/upload`: 500 per 15 min (user), 50,000 per 24h (app)
- `GET /2/users/:id/tweets`: 1500 per 15 min

## Key Notes

- X does NOT support native scheduling via API
- Must implement internal scheduler for delayed X posts
- Media upload is chunked (INIT → APPEND → FINALIZE → STATUS)
- OAuth 2.0 tokens expire; refresh token flow required
- API access tiers: Essential, Elevated, Academic, Enterprise

## References

- https://docs.x.com/x-api/posts/create-post
- https://docs.x.com/x-api/media/upload-media
- https://docs.x.com/x-api/fundamentals/rate-limits
