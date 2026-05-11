import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDashboardAnalytics } from "@/lib/link-analytics";
import DashboardContent from "./dashboard/dashboard-content";

export default async function HomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
        redirect(`/${locale}/login`);
    }

    const analytics = await getDashboardAnalytics(session.user.id);

    return <DashboardContent data={analytics} />;
}
