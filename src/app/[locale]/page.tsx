export function generateStaticParams() {
    return [{ locale: "pt-BR" }, { locale: "en" }, { locale: "es" }];
}

import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n";

export default function RootPage() {
    redirect(`/${defaultLocale}/dashboard`);
}
