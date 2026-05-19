import crypto from "crypto";
import { describe, expect, it } from "vitest";
import {
    parseInstagramCommentWebhook,
    verifyMetaSignature,
} from "./instagram-webhook";

describe("parseInstagramCommentWebhook", () => {
    it("extracts comment events from Instagram webhook changes", () => {
        const events = parseInstagramCommentWebhook({
            object: "instagram",
            entry: [
                {
                    id: "17841400000000000",
                    time: 1766123456,
                    changes: [
                        {
                            field: "comments",
                            value: {
                                id: "18000000000000000",
                                text: "manda o link",
                                from: {
                                    id: "999",
                                    username: "cliente",
                                },
                                media: {
                                    id: "17900000000000000",
                                    media_product_type: "FEED",
                                },
                            },
                        },
                    ],
                },
            ],
        });

        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            eventId: "instagram-comment-18000000000000000",
            recipientId: "17841400000000000",
            postId: "17900000000000000",
            comment: {
                id: "18000000000000000",
                text: "manda o link",
                username: "cliente",
                userId: "999",
            },
        });
    });

    it("skips incomplete comment payloads", () => {
        const events = parseInstagramCommentWebhook({
            object: "instagram",
            entry: [
                {
                    id: "17841400000000000",
                    changes: [
                        {
                            field: "comments",
                            value: {
                                id: "18000000000000000",
                                text: "sem media",
                            },
                        },
                    ],
                },
            ],
        });

        expect(events).toEqual([]);
    });
});

describe("verifyMetaSignature", () => {
    it("accepts valid x-hub-signature-256 values", () => {
        const body = JSON.stringify({ hello: "world" });
        const secret = "secret";
        const digest = crypto
            .createHmac("sha256", secret)
            .update(body, "utf8")
            .digest("hex");

        expect(verifyMetaSignature(body, `sha256=${digest}`, secret)).toBe(true);
    });

    it("rejects invalid signatures", () => {
        expect(verifyMetaSignature("{}", "sha256=deadbeef", "secret")).toBe(false);
    });
});
