"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Button, ErrorAlert, Field } from "@/components/ui";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login({ email: email.trim(), password });
            router.replace("/dashboard");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
                <h1 className="text-xl font-semibold">Log in</h1>
                <p className="text-sm text-zinc-500">Welcome back. Enter your details to continue.</p>
            </div>
            <ErrorAlert message={error} />
            <Field label="Email" name="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field label="Password" name="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" disabled={submitting || !email || !password}>
                {submitting ? "Logging in…" : "Log in"}
            </Button>
            <p className="text-center text-sm text-zinc-500">
                No account yet?{" "}
                <Link href="/register" className="font-medium text-emerald-600 hover:underline">Create one</Link>
            </p>
        </form>
    );
}