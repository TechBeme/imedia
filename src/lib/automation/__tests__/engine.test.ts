import { describe, it, expect } from "vitest";
import { matchesKeyword, selectRandomResponse } from "../engine";
import type { TriggerConfig } from "../types";

describe("matchesKeyword", () => {
    it("matches contains mode case-insensitive by default", () => {
        const config: TriggerConfig = {
            keywords: ["EU QUERO", "quero"],
            matchMode: "contains",
            caseSensitive: false,
        };
        expect(matchesKeyword("eu quero o link", config)).toBe(true);
        expect(matchesKeyword("EU QUERO", config)).toBe(true);
        expect(matchesKeyword("Quero mais info", config)).toBe(true);
        expect(matchesKeyword("nao quero nada", config)).toBe(true);
    });

    it("does not match when keyword is absent", () => {
        const config: TriggerConfig = {
            keywords: ["promo"],
            matchMode: "contains",
            caseSensitive: false,
        };
        expect(matchesKeyword("hello world", config)).toBe(false);
    });

    it("matches exact mode", () => {
        const config: TriggerConfig = {
            keywords: ["EU QUERO"],
            matchMode: "exact",
            caseSensitive: false,
        };
        expect(matchesKeyword("eu quero", config)).toBe(true);
        expect(matchesKeyword("eu quero o link", config)).toBe(false);
    });

    it("respects case sensitivity when enabled", () => {
        const config: TriggerConfig = {
            keywords: ["EU QUERO"],
            matchMode: "contains",
            caseSensitive: true,
        };
        expect(matchesKeyword("EU QUERO", config)).toBe(true);
        expect(matchesKeyword("eu quero", config)).toBe(false);
    });

    it("matches any keyword in the list (OR logic)", () => {
        const config: TriggerConfig = {
            keywords: ["link", "promo", "desconto"],
            matchMode: "contains",
            caseSensitive: false,
        };
        expect(matchesKeyword("manda o link", config)).toBe(true);
        expect(matchesKeyword("tem promo?", config)).toBe(true);
        expect(matchesKeyword("quero desconto", config)).toBe(true);
        expect(matchesKeyword("oi tudo bem", config)).toBe(false);
    });

    it("handles empty keywords gracefully", () => {
        const config: TriggerConfig = {
            keywords: [],
            matchMode: "contains",
            caseSensitive: false,
        };
        expect(matchesKeyword("anything", config)).toBe(false);
    });

    it("handles emoji in comment text", () => {
        const config: TriggerConfig = {
            keywords: ["quero"],
            matchMode: "contains",
            caseSensitive: false,
        };
        expect(matchesKeyword("eu quero 😍", config)).toBe(true);
    });
});

describe("selectRandomResponse", () => {
    it("returns empty string for empty messages", () => {
        expect(selectRandomResponse([])).toBe("");
    });

    it("returns the only message when list has one item", () => {
        expect(selectRandomResponse(["hello"])).toBe("hello");
    });

    it("returns one of the messages when list has multiple items", () => {
        const messages = ["a", "b", "c"];
        const result = selectRandomResponse(messages);
        expect(messages).toContain(result);
    });

    it("can return different messages across calls", () => {
        const messages = ["a", "b", "c", "d", "e"];
        const results = new Set<string>();
        for (let i = 0; i < 50; i++) {
            results.add(selectRandomResponse(messages));
        }
        // With 50 calls and 5 options, we should see at least 2 different results
        expect(results.size).toBeGreaterThan(1);
    });
});
