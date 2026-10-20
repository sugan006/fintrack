"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

// The home page just sends people to the right place
export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) router.replace(user ? "/dashboard" : "/login");
    }, [loading, user, router]);

    return <Spinner />;
}