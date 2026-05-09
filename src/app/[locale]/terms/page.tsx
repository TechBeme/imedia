import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "terms" });
    return {
        title: t("metadata.title"),
        description: t("metadata.description"),
    };
}

export default async function TermsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "terms" });

    const sections = [
        "acceptance",
        "serviceDescription",
        "accounts",
        "acceptableUse",
        "intellectualProperty",
        "userContent",
        "thirdPartyServices",
        "payments",
        "liability",
        "indemnification",
        "termination",
        "governingLaw",
        "general",
        "contact",
    ] as const;

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link
                        href="/"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {t("backToHome")}
                    </Link>
                </div>

                <article className="prose prose-neutral dark:prose-invert max-w-none">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
                        {t("title")}
                    </h1>
                    <p className="text-muted-foreground text-sm mb-8">
                        {t("lastUpdated")}
                    </p>

                    {sections.map((section) => (
                        <section key={section} className="mb-8">
                            <h2 className="text-xl font-semibold tracking-tight mt-8 mb-4">
                                {t(`sections.${section}.heading`)}
                            </h2>
                            <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {t(`sections.${section}.content`)}
                            </div>
                        </section>
                    ))}
                </article>

                <div className="mt-12 pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center">
                        {t("footer")}
                    </p>
                </div>
            </div>
        </div>
    );
}
