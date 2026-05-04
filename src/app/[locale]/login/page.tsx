import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "auth" });

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left side - decorative */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-gradient-to-br from-primary/90 via-primary to-primary-foreground/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white font-bold text-lg">i</span>
                        </div>
                        <span className="text-white font-semibold text-xl tracking-tight">iMedia</span>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                            {t("loginHeroTitle")}
                        </h1>
                        <p className="text-lg text-white/80 leading-relaxed">
                            {t("loginHeroDescription")}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-white/60 text-sm">
                        <span>2026 iMedia</span>
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        <span>{t("allRightsReserved")}</span>
                    </div>
                </div>
            </div>

            {/* Right side - form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
                <div className="w-full max-w-md">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
