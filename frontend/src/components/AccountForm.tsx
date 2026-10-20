"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import type { Account, AccountType } from "@/types";
import { Button, ErrorAlert, Field, SelectField } from "@/components/ui";

const ACCOUNT_TYPES: AccountType[] = ["Cash", "Bank", "Savings"];

export interface AccountFormValues {
    name: string;
    type: AccountType;
    initialBalance: number;
}

interface AccountFormProps {
    // When editing, the account being changed; the balance can't be edited
    account?: Account;
    onSubmit: (values: AccountFormValues) => Promise<void>;
    onCancel: () => void;
}

export default function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
    const isEdit = account !== undefined;
    const [name, setName] = useState(account?.name ?? "");
    const [type, setType] = useState<AccountType>(account?.type ?? "Bank");
    const [initialBalance, setInitialBalance] = useState("0");
    const [nameError, setNameError] = useState<string>();
    const [balanceError, setBalanceError] = useState<string>();
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        // Same rules as the API: name required (max 100), balance between 0 and 1,000,000,000
        const trimmed = name.trim();
        const balance = Number(initialBalance);
        const nextNameError = !trimmed ? "Enter a name." : trimmed.length > 100 ? "Name must be 100 characters or fewer." : undefined;
        const nextBalanceError = !isEdit && (initialBalance === "" || isNaN(balance) || balance < 0 || balance > 1_000_000_000)
            ? "Enter an amount between 0 and 1,000,000,000." : undefined;
        setNameError(nextNameError);
        setBalanceError(nextBalanceError);
        if (nextNameError || nextBalanceError) return;

        setSubmitting(true);
        try {
            await onSubmit({ name: trimmed, type, initialBalance: balance });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">{isEdit ? `Edit ${account.name}` : "New account"}</h2>
            <ErrorAlert message={error} />
            <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Name" name="name" placeholder="e.g. Commercial Bank" required
                    value={name} error={nameError} onChange={(e) => setName(e.target.value)} />
                <SelectField label="Type" name="type" value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}>
                    {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </SelectField>
                {!isEdit && (
                    <Field label="Opening balance (LKR)" name="initialBalance" type="number" min="0" step="0.01"
                        inputMode="decimal" value={initialBalance} error={balanceError}
                        onChange={(e) => setInitialBalance(e.target.value)} />
                )}
            </div>
            {isEdit && (
                <p className="text-xs text-zinc-500">
                    To change the balance, add an income or expense transaction instead.
                </p>
            )}
            <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : isEdit ? "Save changes" : "Create account"}
                </Button>
                <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}