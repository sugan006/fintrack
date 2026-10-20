import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function Spinner({ label = "Loading…" }: { label?: string }) {
    return (
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-zinc-500" role="status">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600" />
            {label}
        </div>
    );
}

export function ErrorAlert({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {message}
        </div>
    );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export function Field({ label, error, id, ...inputProps }: FieldProps) {
    const inputId = id ?? inputProps.name;
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={inputId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {label}
            </label>
            <input
                id={inputId}
                aria-invalid={error ? true : undefined}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 aria-[invalid=true]:border-red-500 dark:border-zinc-700 dark:bg-zinc-900"
                {...inputProps}
            />
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className={`rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            {...props}
        />
    );
}