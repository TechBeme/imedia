import { describe, it, expect } from "vitest";
import { getAdapter } from "../adapters";

describe("getAdapter", () => {
    it("returns instagram adapter for instagram platform", () => {
        const adapter = getAdapter("instagram");
        expect(adapter).toBeDefined();
        expect(adapter?.platform).toBe("instagram");
    });

    it("returns undefined for unimplemented platforms", () => {
        expect(getAdapter("tiktok")).toBeUndefined();
        expect(getAdapter("youtube")).toBeUndefined();
        expect(getAdapter("x")).toBeUndefined();
    });
});
