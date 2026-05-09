import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const MESSAGES_DIR = path.resolve(__dirname, "../../../messages");
const LOCALES = ["pt-BR", "en", "es"];

describe("i18n Translation Completeness", () => {
    const messages: Record<string, Record<string, unknown>> = {};

    beforeAll(() => {
        for (const locale of LOCALES) {
            const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
            const content = fs.readFileSync(filePath, "utf8");
            messages[locale] = JSON.parse(content);
        }
    });

    it("should have no flat keys containing '.' at the top level (must be nested)", () => {
        for (const locale of LOCALES) {
            const topLevelKeys = Object.keys(messages[locale]);
            const invalidKeys = topLevelKeys.filter((k) => k.includes("."));
            expect(invalidKeys, `Invalid flat keys in ${locale}.json (must be nested objects): ${invalidKeys.join(", ")}`).toEqual([]);
        }
    });

    it("should have the same keys across all locale files", () => {
        const referenceKeys = getFlatKeys(messages[LOCALES[0]]).sort();

        for (let i = 1; i < LOCALES.length; i++) {
            const locale = LOCALES[i];
            const keys = getFlatKeys(messages[locale]).sort();
            const missing = referenceKeys.filter((k) => !keys.includes(k));
            const extra = keys.filter((k) => !referenceKeys.includes(k));

            expect(missing, `Missing keys in ${locale}.json: ${missing.join(", ")}`).toEqual([]);
            expect(extra, `Extra keys in ${locale}.json: ${extra.join(", ")}`).toEqual([]);
        }
    });

    it("should have no empty string values", () => {
        for (const locale of LOCALES) {
            const flat = flattenObject(messages[locale]);
            const emptyKeys = Object.entries(flat)
                .filter(([, v]) => typeof v === "string" && v.trim() === "")
                .map(([k]) => k);
            expect(emptyKeys, `Empty values in ${locale}.json: ${emptyKeys.join(", ")}`).toEqual([]);
        }
    });

    it("should have no null or undefined values", () => {
        for (const locale of LOCALES) {
            const flat = flattenObject(messages[locale]);
            const nullKeys = Object.entries(flat)
                .filter(([, v]) => v === null || v === undefined)
                .map(([k]) => k);
            expect(nullKeys, `Null/undefined values in ${locale}.json: ${nullKeys.join(", ")}`).toEqual([]);
        }
    });
});

function getFlatKeys(obj: Record<string, unknown>, prefix = ""): string[] {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            keys.push(...getFlatKeys(value as Record<string, unknown>, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
        } else {
            result[fullKey] = value;
        }
    }
    return result;
}
