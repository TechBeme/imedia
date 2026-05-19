import { db } from '../src/db/index';
import { webhookEvents } from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';

async function main() {
    const events = await db.select().from(webhookEvents).where(eq(webhookEvents.platform, 'instagram')).orderBy(desc(webhookEvents.createdAt)).limit(10);
    console.log(JSON.stringify(events, null, 2));
}

main().catch(console.error);
