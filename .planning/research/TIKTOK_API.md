# Research: TikTok Content Posting API

**Date:** 2026-05-04
**Source:** Official TikTok for Developers documentation

## Overview

TikTok Content Posting API enables direct video and photo uploads to TikTok accounts. OAuth 2.0 required.

## Authentication

### OAuth 2.0 Flow
- Authorization endpoint: `https://www.tiktok.com/v2/auth/authorize/`
- Token endpoint: `https://open.tiktokapis.com/v2/oauth/token/`
- Scopes:
  - `video.upload` — upload videos
  - `video.publish` — publish videos
  - `user.info.basic` — basic user info
  - `user.info.profile` — profile info
  - `comment.list` — list comments
  - `comment.list.manage` — manage comments

## Content Posting

### Direct Post
- Endpoint: `POST https://open.tiktokapis.com/v2/post/publish/video/init/`
- Supports scheduling via `publish_time` parameter (Unix timestamp)
- Video specs: MP4, max 1GB, recommended 1080x1920 (9:16)

### Upload Flow
1. Initialize upload: `POST /v2/post/publish/video/init/`
2. Upload video chunks (if chunked) or direct upload
3. Publish or schedule publish

### Parameters
- `title` — video caption/description
- `privacy_level` — PUBLIC, FRIENDS, PRIVATE
- `disable_duet`, `disable_stitch`, `disable_comment` — interaction controls
- `video_cover_timestamp_ms` — cover frame selection
- `publish_time` — schedule time (Unix timestamp in seconds)

## Comments

- `GET /v2/video/comment/list/` — list comments on a video
- `POST /v2/video/comment/reply/` — reply to a comment
- Requires `comment.list` and `comment.list.manage` scopes

## Rate Limits

- Upload: varies by app tier
- Publishing: subject to TikTok's content moderation and rate policies

## Key Notes

- TikTok supports native scheduling via `publish_time` parameter
- Videos go through content review before publishing
- Creator must have a TikTok Business Account or Creator Account
- App must be approved by TikTok for Content Posting API access

## References

- https://developers.tiktok.com/doc/content-posting-api-get-started
- https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
- https://developers.tiktok.com/doc/content-posting-api-reference-upload-video
