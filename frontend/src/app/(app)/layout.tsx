"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

const NAV_LINKS = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/accounts", label: "Accounts" },
    { href: "/transactions", label: "Transactions" },
    { href: "/transfer", label: "Transfer" },
];

// Every page in this group needs a logged-in user
export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) router.replace("/login");
    }, [loading, user, router]);

    if (loading || !user) return <Spinner />;

    function handleLogout() {
        logout();
        router.replace("/login");
    }

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
            <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
                    <Link href="/dashboard" className="text-lg font-bold text-emerald-600">FinTrack</Link>
                    <nav className="flex flex-wrap gap-1">
                        {NAV_LINKS.map((link) => {
                            const active = pathname.startsWith(link.href);
                            return (
                                <Link key={link.href} href={link.href}
                                    aria-current={active ? "page" : undefined}
                                    className={`rounded-md px-3 py-1.5 text-sm ${active
                                        ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}>
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="ml-auto flex items-center gap-3 text-sm">
                        <span className="hidden text-zinc-500 sm:inline">{user.fullName}</span>
                        <button onClick={handleLogout}
                            className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                            Log out
                        </button>
                    </div>
                </div>
            </header>
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        </div>
    );
}