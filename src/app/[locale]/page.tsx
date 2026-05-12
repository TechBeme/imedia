import { redirect } from "next/navigation";

export default function RootPage() {
    // This route is never hit because the middleware handles locale routing
    // The locale-specific root (e.g. /pt-BR) is handled by (dashboard)/page.tsx
    redirect("/");
}
