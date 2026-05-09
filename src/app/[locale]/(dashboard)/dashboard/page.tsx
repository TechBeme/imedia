import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDashboardAnalytics } from "@/lib/link-analytics";
import DashboardContent from "./dashboard-content";

export default async function DashboardPage() {
    const session = await getSession();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const analytics = await getDashboardAnalytics(session.user.id);

    return <DashboardContent data={analytics} />;
}
