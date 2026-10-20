"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatMoney, todayIso } from "@/lib/format";
import type { Account, Transaction } from "@/types";
import { Button, ErrorAlert, Field, SelectField, Spinner } from "@/components/ui";

interface FormErrors {
    fromAccountId?: string;
    toAccountId?: string;
    amount?: string;
    date?: string;
}

export default function TransferPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recent, setRecent] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromAccountId, setFromAccountId] = useState("");
    const [toAccountId, setToAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(todayIso());
    const [description, setDescription] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        try {
            // Each transfer has a "TransferOut" row, so those list one line per transfer
            const [accountList, transfers] = await Promise.all([
                api.getAccounts(),
                api.getTransactions({ type: "TransferOut", pageSize: 5 }),
            ]);
            setAccounts(accountList);
            setRecent(transfers.items);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not load your accounts.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
        loadData();
    }, [loadData]);

    const fromAccount = accounts.find((a) => String(a.id) === fromAccountId);
    const accountName = (id: string) => accounts.find((a) => String(a.id) === id)?.name ?? "";

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        // Same rules as the API, plus a balance check so the user gets instant feedback
        const value = Number(amount);
        const errors: FormErrors = {};
        if (!fromAccountId) errors.fromAccountId = "Choose the account to move money from.";
        if (!toAccountId) errors.toAccountId = "Choose the account to move money to.";
        else if (toAccountId === fromAccountId) errors.toAccountId = "Choose a different account.";
        if (amount === "" || isNaN(value) || value < 0.01 || value > 1_000_000_000)
            errors.amount = "Enter an amount between 0.01 and 1,000,000,000.";
        else if (fromAccount && value > fromAccount.balance)
            errors.amount = `Only ${formatMoney(fromAccount.balance)} available in ${fromAccount.name}.`;
        if (!date) errors.date = "Choose a date.";
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);
        try {
            const result = await api.createTransfer({
                fromAccountId: Number(fromAccountId),
                toAccountId: Number(toAccountId),
                amount: value,
                date,
                description: description.trim() || undefined,
            });
            setSuccess(
                `Moved ${formatMoney(result.amount)} from ${accountName(fromAccountId)} to ${accountName(toAccountId)}. ` +
                `New balances: ${formatMoney(result.fromAccountBalance)} and ${formatMoney(result.toAccountBalance)}.`,
            );
            setAmount("");
            setDescription("");
            await loadData();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <Spinner label="Loading accounts…" />;

    if (accounts.length < 2) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-semibold">Transfer</h1>
                <ErrorAlert message={error} />
                <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
                    <p className="font-medium">You need at least two accounts to make a transfer</p>
                    <p className="mt-1 text-sm text-zinc-500">
                        <Link href="/accounts" className="font-medium text-emerald-600 hover:underline">Add another account</Link> to get started.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Transfer</h1>
                <p className="text-sm text-zinc-500">Move money between your own accounts. Both balances update together.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate
                className="flex max-w-2xl flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <ErrorAlert message={error} />
                {success && (
                    <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                        {success}
                    </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField label="From" name="fromAccountId" value={fromAccountId} error={fieldErrors.fromAccountId}
                        onChange={(e) => setFromAccountId(e.target.value)}>
                        <option value="">Choose account</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({formatMoney(a.balance)})</option>)}
                    </SelectField>
                    <SelectField label="To" name="toAccountId" value={toAccountId} error={fieldErrors.toAccountId}
                        onChange={(e) => setToAccountId(e.target.value)}>
                        <option value="">Choose account</option>
                        {accounts.filter((a) => String(a.id) !== fromAccountId).map((a) => (
                            <option key={a.id} value={a.id}>{a.name} ({formatMoney(a.balance)})</option>
                        ))}
                    </SelectField>
                    <Field label="Amount (LKR)" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal"
                        value={amount} error={fieldErrors.amount} onChange={(e) => setAmount(e.target.value)} />
                    <Field label="Date" name="date" type="date" value={date} error={fieldErrors.date}
                        onChange={(e) => setDate(e.target.value)} />
                </div>
                <Field label="Description (optional)" name="description" maxLength={250} placeholder="e.g. Move to savings"
                    value={description} onChange={(e) => setDescription(e.target.value)} />
                <div>
                    <Button type="submit" disabled={submitting}>{submitting ? "Transferring…" : "Transfer money"}</Button>
                </div>
            </form>

            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">Recent transfers</h2>
                {recent.length === 0 ? (
                    <p className="text-sm text-zinc-500">No transfers yet.</p>
                ) : (
                    <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                        {recent.map((t) => (
                            <li key={t.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                                <div>
                                    <p>{t.description || `From ${t.accountName}`}</p>
                                    <p className="text-xs text-zinc-500">{formatDate(t.date)} · from {t.accountName}</p>
                                </div>
                                <p className="font-medium tabular-nums">{formatMoney(t.amount)}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}