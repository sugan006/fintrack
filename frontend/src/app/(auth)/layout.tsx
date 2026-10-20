"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

// Login and register pages: logged-in users go straight to the dashboard
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) router.replace("/dashboard");
    }, [loading, user, router]);

    if (loading || user) return <Spinner />;

    return (
        <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
            <div className="w-full max-w-sm">
                <p className="mb-6 text-center text-2xl font-bold text-emerald-600">FinTrack</p>
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    {children}
                </div>
            </div>
        </main>
    );
}