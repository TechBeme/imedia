import { instagramAdapter } from "./instagram";
import type { InstagramAutomationAdapter } from "./instagram";

export type AutomationAdapter = InstagramAutomationAdapter;

const adapters: Record<string, AutomationAdapter> = {
    instagram: instagramAdapter,
};

export function getAdapter(platform: string): AutomationAdapter | undefined {
    return adapters[platform];
}

export function registerAdapter(
    platform: string,
    adapter: AutomationAdapter
): void {
    adapters[platform] = adapter;
}

export { instagramAdapter };
