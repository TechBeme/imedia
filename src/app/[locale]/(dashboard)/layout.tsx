import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import type { Locale } from "@/lib/i18n";

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-background">
            <Sidebar />
            <div className="lg:ml-60 flex flex-col min-h-screen">
                <Header locale={locale as Locale} />
                <main className="flex-1 p-4 lg:p-6">
                    <div className="max-w-6xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}
