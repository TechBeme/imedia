import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await getSession();

    if (session) {
        redirect(`/${locale}/dashboard`);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <LoginForm />
        </div>
    );
}
