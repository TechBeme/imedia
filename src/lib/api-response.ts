import { NextResponse } from "next/server";

export const ErrorCodes = {
    AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
    AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
    AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    PLATFORM_NOT_CONNECTED: "PLATFORM_NOT_CONNECTED",
    PLATFORM_API_ERROR: "PLATFORM_API_ERROR",
    CREDENTIALS_INVALID: "CREDENTIALS_INVALID",
    CREDENTIALS_EXISTS: "CREDENTIALS_EXISTS",
    CREDENTIALS_NOT_FOUND: "CREDENTIALS_NOT_FOUND",
    FORBIDDEN: "FORBIDDEN",
    LINK_NOT_FOUND: "LINK_NOT_FOUND",
    LINK_EXPIRED: "LINK_EXPIRED",
    LINK_PASSWORD_REQUIRED: "LINK_PASSWORD_REQUIRED",
    LINK_INVALID_PASSWORD: "LINK_INVALID_PASSWORD",
    LINK_SLUG_TAKEN: "LINK_SLUG_TAKEN",
    LINK_INVALID_SLUG: "LINK_INVALID_SLUG",
    DOMAIN_NOT_FOUND: "DOMAIN_NOT_FOUND",
    DOMAIN_ALREADY_EXISTS: "DOMAIN_ALREADY_EXISTS",
    DOMAIN_NOT_VERIFIED: "DOMAIN_NOT_VERIFIED",
    DOMAIN_VERIFICATION_FAILED: "DOMAIN_VERIFICATION_FAILED",
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

export function success<T>(data: T, status = 200) {
    return NextResponse.json({ data }, { status });
}

export function error(code: ErrorCode, message?: string, status = 400, headers?: Record<string, string>) {
    return NextResponse.json({ error: { code, message } }, { status, headers });
}

export function unauthorized(message = "Unauthorized") {
    return error("AUTH_UNAUTHORIZED", message, 401);
}

export function notFound(message = "Not found") {
    return error("NOT_FOUND", message, 404);
}

export function conflict(message = "Conflict") {
    return error("CONFLICT", message, 409);
}

export function internalError(message = "Internal server error") {
    return error("INTERNAL_ERROR", message, 500);
}
