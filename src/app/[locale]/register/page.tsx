import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
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
            <RegisterForm />
        </div>
    );
}
