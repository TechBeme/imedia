import { db } from '../src/db/index';
import { socialAccounts, automations, automationActions } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
    const accounts = await db.select().from(socialAccounts).where(eq(socialAccounts.platform, 'instagram'));
    console.log('=== CONTAS INSTAGRAM ===');
    console.log(JSON.stringify(accounts.map(a => ({
        id: a.id,
        accountId: a.accountId,
        username: a.username,
        isActive: a.isActive,
        hasToken: !!a.accessToken,
        tokenPreview: a.accessToken ? a.accessToken.substring(0, 20) + '...' : null,
        createdAt: a.createdAt
    })), null, 2));

    const allAutomations = await db.select().from(automations).where(eq(automations.platform, 'instagram'));
    console.log('\n=== AUTOMACOES INSTAGRAM ===');
    console.log(JSON.stringify(allAutomations.map(a => ({
        id: a.id,
        name: a.name,
        socialAccountId: a.socialAccountId,
        isActive: a.isActive,
        triggerConfig: a.triggerConfig,
        scope: a.scope
    })), null, 2));
}

main().catch(console.error);
