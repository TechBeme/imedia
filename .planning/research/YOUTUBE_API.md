# Research: YouTube Data API v3

**Date:** 2026-05-04
**Source:** Official Google for Developers documentation

## Overview

YouTube Data API v3 allows managing videos, playlists, channels, and captions. OAuth 2.0 required for write operations.

## Authentication

### Scopes Required
- `https://www.googleapis.com/auth/youtube.upload` — upload videos
- `https://www.googleapis.com/auth/youtube` — manage account
- `https://www.googleapis.com/auth/youtube.force-ssl` — SSL-required operations
- `https://www.googleapis.com/auth/youtubepartner` — manage captions

### Token Management
- Access tokens expire; refresh tokens stored for renewal
- OAuth 2.0 for Web Server Applications flow

## Video Operations

### Upload (`videos.insert`)
- Endpoint: `POST https://www.googleapis.com/upload/youtube/v3/videos`
- Supports resumable uploads (recommended for large files)
- Metadata: title (max 100 chars), description (max 5000 bytes), tags (max 500 chars), categoryId, privacyStatus
- **Scheduling**: Set `status.publishAt` (ISO 8601) with `privacyStatus=private`. Video auto-publishes at scheduled time.
- **Captions**: Upload via `captions.insert` after video is processed

### Update (`videos.update`)
- Update metadata: title, description, tags, thumbnail, privacy status

### List (`videos.list`)
- Retrieve user's videos with snippet, contentDetails, status, statistics

### Delete (`videos.delete`)
- Remove video from channel

## Captions

- `captions.insert` — upload caption file (SRT, SBV, etc.)
- `captions.list` — list captions for a video
- `captions.download` — download caption file
- `captions.update` — update caption metadata
- `captions.delete` — delete caption

## Analytics

- YouTube Analytics API (separate from Data API)
- Metrics: views, likes, comments, shares, watch time, subscribers gained/lost
- Requires `https://www.googleapis.com/auth/yt-analytics.readonly`

## Rate Limits

- Default quota: 10,000 units per day
- `videos.insert`: ~1600 units per upload
- Quota usage varies by operation

## Key Notes

- Unverified API projects (created after July 28, 2020) upload videos as private by default
- Must undergo audit to make videos public
- Videos can be scheduled via `publishAt` field (native scheduling supported)
- Processing status available via `processingDetails`

## References

- https://developers.google.com/youtube/v3/docs/videos
- https://developers.google.com/youtube/v3/guides/uploading_a_video
- https://developers.google.com/youtube/v3/docs/captions
