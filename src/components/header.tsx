"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { MobileSidebar } from "@/components/sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";

export function Header() {
    const router = useRouter();
    const locale = useLocale();
    const { data: session } = authClient.useSession();

    async function handleLogout() {
        await authClient.signOut();
        toast.success("Logged out");
        router.push(`/${locale}/login`);
        router.refresh();
    }

    const userInitials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 lg:px-8">
            <MobileSidebar />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
                <DropdownMenu>
                    <DropdownMenuTrigger className="relative h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-accent transition-colors">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <div className="flex items-center gap-2 p-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col space-y-0.5">
                                <p className="text-sm font-medium">{session?.user?.name}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                    {session?.user?.email}
                                </p>
                            </div>
                        </div>
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
