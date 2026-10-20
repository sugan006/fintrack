"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Button, ErrorAlert, Field } from "@/components/ui";

interface FormErrors {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

// Same rules as the API's RegisterRequest, so most mistakes are caught before sending
function validate(fullName: string, email: string, password: string, confirmPassword: string): FormErrors {
    const errors: FormErrors = {};
    if (!fullName.trim()) errors.fullName = "Enter your name.";
    else if (fullName.trim().length > 100) errors.fullName = "Name must be 100 characters or fewer.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Enter a valid email address.";
    if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
    return errors;
}

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        const errors = validate(fullName, email, password, confirmPassword);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);
        try {
            await register({ fullName: fullName.trim(), email: email.trim(), password });
            router.replace("/dashboard");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
                <h1 className="text-xl font-semibold">Create your account</h1>
                <p className="text-sm text-zinc-500">Start tracking your money in a minute.</p>
            </div>
            <ErrorAlert message={error} />
            <Field label="Full name" name="fullName" autoComplete="name" required
                value={fullName} error={fieldErrors.fullName} onChange={(e) => setFullName(e.target.value)} />
            <Field label="Email" name="email" type="email" autoComplete="email" required
                value={email} error={fieldErrors.email} onChange={(e) => setEmail(e.target.value)} />
            <Field label="Password" name="password" type="password" autoComplete="new-password" required
                value={password} error={fieldErrors.password} onChange={(e) => setPassword(e.target.value)} />
            <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required
                value={confirmPassword} error={fieldErrors.confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} />
            <Button type="submit" disabled={submitting}>
                {submitting ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-emerald-600 hover:underline">Log in</Link>
            </p>
        </form>
    );
}