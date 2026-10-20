"use client";

import { useAuth } from "@/lib/auth";

// Placeholder until Block 12 adds the monthly summary
export default function DashboardPage() {
    const { user } = useAuth();
    return (
        <div>
            <h1 className="text-2xl font-semibold">Welcome, {user?.fullName}</h1>
            <p className="mt-1 text-sm text-zinc-500">Your monthly summary will appear here.</p>
        </div>
    );
}