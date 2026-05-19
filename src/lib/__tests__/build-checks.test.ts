import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

describe("Build & Lint Checks", () => {
    it("should have middleware.ts at project root", () => {
        const middlewarePath = path.resolve(__dirname, "../../../middleware.ts");
        expect(fs.existsSync(middlewarePath)).toBe(true);
    });

    it("should have localePrefix set to 'always' in routing config", () => {
        const routingPath = path.resolve(__dirname, "../../i18n/routing.ts");
        const content = fs.readFileSync(routingPath, "utf8");
        expect(content).toContain('localePrefix: "always"');
    });

    it("should have no flat keys with dots at the top level in any locale file", () => {
        const messagesDir = path.resolve(__dirname, "../../../messages");
        const locales = ["pt-BR", "en", "es"];

        for (const locale of locales) {
            const filePath = path.join(messagesDir, `${locale}.json`);
            const content = fs.readFileSync(filePath, "utf8");
            const data = JSON.parse(content);
            const topLevelKeys = Object.keys(data);
            const invalid = topLevelKeys.filter((k) => k.includes("."));
            expect(invalid, `Invalid flat keys in ${locale}.json (must be nested objects)`).toEqual([]);
        }
    });

    it("should pass TypeScript type checking on production code", () => {
        let output = "";
        try {
            output = execSync("npx tsc --noEmit -p tsconfig.build.json", {
                cwd: path.resolve(__dirname, "../../.."),
                encoding: "utf8",
                stdio: ["pipe", "pipe", "pipe"],
                timeout: 30000,
            });
        } catch (error) {
            const commandError = error as {
                stdout?: string;
                stderr?: string;
                message?: string;
            };
            output = commandError.stdout || commandError.stderr || commandError.message || "";
        }
        // If tsc outputs anything, there are type errors
        expect(output.trim()).toBe("");
    }, 30000);
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
