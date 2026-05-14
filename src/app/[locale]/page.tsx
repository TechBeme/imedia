import { redirect } from "next/navigation";

export default async function RootPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    // Redirect locale root (e.g. /pt-BR) to dashboard
    const { locale } = await params;
    redirect(`/${locale}/dashboard`);
}
