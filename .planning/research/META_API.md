# Research: Meta Graph API (Instagram / Facebook)

**Date:** 2026-05-04
**Source:** Official Meta for Developers documentation

## Overview

The Instagram Platform provides two login paths:
1. **Instagram API with Instagram Login** — `graph.instagram.com`
2. **Instagram API with Facebook Login** — `graph.facebook.com` (used currently)

## Authentication

### Scopes Required (Facebook Login path)
- `instagram_basic` — read profile info
- `instagram_content_publish` — publish posts
- `pages_read_engagement` — read page engagement
- `instagram_business_basic` — (Instagram Login path)
- `instagram_business_content_publish` — (Instagram Login path)
- Optional: `ads_management`, `ads_read` — if page granted via Business Manager

### Tokens
- **Facebook Page access token** — required for Facebook Login path
- **Instagram User access token** — for Instagram Login path

## Content Publishing

### Endpoints
- `POST /<IG_ID>/media` — Create media container
- `POST /<IG_ID>/media_publish` — Publish container
- `GET /<IG_CONTAINER_ID>?fields=status_code` — Check publishing status
- `GET /<IG_ID>/content_publishing_limit` — Check rate limit usage
- `POST https://rupload.facebook.com/ig-api-upload/<IG_MEDIA_CONTAINER_ID>` — Resumable video upload

### Media Types
- **Image**: `image_url` (JPEG only), caption, alt_text
- **Video/Reels**: `video_url`, `media_type=VIDEO/REELS`, resumable upload supported
- **Stories**: `media_type=STORIES`
- **Carousel**: `media_type=CAROUSEL`, `children` (up to 10 container IDs)
- **Trial Reels**: `trial_params` with `graduation_strategy`

### Rate Limits
- 100 API-published posts per 24-hour moving period
- Carousels count as a single post

### Publishing Flow
1. Create container with `POST /<IG_ID>/media`
2. (For resumable videos) Upload to `rupload.facebook.com`
3. Poll container status until `FINISHED`
4. Publish with `POST /<IG_ID>/media_publish` using `creation_id`

## Insights

- Available via Instagram Graph API Insights endpoints
- Metrics: impressions, reach, engagement, saves, shares, profile visits
- Requires `instagram_basic` permission

## Comment Moderation

- `GET /<IG_MEDIA_ID>/comments` — list comments
- `POST /<IG_COMMENT_ID>/replies` — reply to comment
- `DELETE /<IG_COMMENT_ID>` — hide/delete comment
- `POST /<IG_MEDIA_ID>/comments` — create comment (if enabled)

## Private Replies / DMs

- Limited API support; primarily via Instagram Messaging API (requires additional permissions)
- Webhooks available for message events

## Key Limitations

- JPEG only for images
- No shopping tags or filters via API
- Page Publishing Authorization (PPA) may be required
- Media must be on a publicly accessible server at publish time
- Containers expire after 24 hours if not published

## References

- https://developers.facebook.com/docs/instagram-platform/content-publishing/
- https://developers.facebook.com/docs/instagram-platform/insights
- https://developers.facebook.com/docs/instagram-platform/comment-moderation
