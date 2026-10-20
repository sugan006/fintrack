"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { todayIso } from "@/lib/format";
import type { Account, Category, Transaction } from "@/types";
import { Button, ErrorAlert, Field, SelectField } from "@/components/ui";

type EntryType = "Income" | "Expense";

export interface TransactionFormValues {
    accountId: number;
    type: EntryType;
    categoryId: number | null;
    amount: number;
    date: string;
    description?: string;
}

interface TransactionFormProps {
    accounts: Account[];
    categories: Category[];
    // When editing, the transaction being changed; its account can't be changed
    transaction?: Transaction;
    onSubmit: (values: TransactionFormValues) => Promise<void>;
    onCancel: () => void;
}

interface FormErrors {
    accountId?: string;
    amount?: string;
    date?: string;
    description?: string;
}

export default function TransactionForm({ accounts, categories, transaction, onSubmit, onCancel }: TransactionFormProps) {
    const isEdit = transaction !== undefined;
    const [type, setType] = useState<EntryType>(transaction?.type === "Income" ? "Income" : "Expense");
    const [accountId, setAccountId] = useState(String(transaction?.accountId ?? accounts[0]?.id ?? ""));
    const [categoryId, setCategoryId] = useState(transaction?.categoryId ? String(transaction.categoryId) : "");
    const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
    const [date, setDate] = useState(transaction ? transaction.date.slice(0, 10) : todayIso());
    const [description, setDescription] = useState(transaction?.description ?? "");
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Only categories that match the chosen type can be used (the API checks this too)
    const matchingCategories = categories.filter((c) => c.type === type);

    function changeType(next: EntryType) {
        setType(next);
        setCategoryId(""); // the old category belongs to the other type
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        // Same rules as the API: amount 0.01–1,000,000,000, date required, description max 250
        const value = Number(amount);
        const errors: FormErrors = {};
        if (!accountId) errors.accountId = "Choose an account.";
        if (amount === "" || isNaN(value) || value < 0.01 || value > 1_000_000_000)
            errors.amount = "Enter an amount between 0.01 and 1,000,000,000.";
        if (!date) errors.date = "Choose a date.";
        if (description.trim().length > 250) errors.description = "Description must be 250 characters or fewer.";
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setSubmitting(true);
        try {
            await onSubmit({
                accountId: Number(accountId),
                type,
                categoryId: categoryId ? Number(categoryId) : null,
                amount: value,
                date,
                description: description.trim() || undefined,
            });
        } catch (err) {
            // e.g. "Insufficient balance for this expense."
            setError(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">{isEdit ? "Edit transaction" : "New transaction"}</h2>
            <ErrorAlert message={error} />

            <div className="flex gap-2" role="group" aria-label="Transaction type">
                {(["Expense", "Income"] as const).map((option) => (
                    <button key={option} type="button" onClick={() => changeType(option)}
                        aria-pressed={type === option}
                        className={`rounded-md border px-4 py-1.5 text-sm font-medium ${type === option
                            ? option === "Income"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"}`}>
                        {option}
                    </button>
                ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Account" name="accountId" value={accountId} disabled={isEdit}
                    error={fieldErrors.accountId} onChange={(e) => setAccountId(e.target.value)}>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </SelectField>
                <SelectField label="Category" name="categoryId" value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">No category</option>
                    {matchingCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </SelectField>
                <Field label="Amount (LKR)" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal"
                    value={amount} error={fieldErrors.amount} onChange={(e) => setAmount(e.target.value)} />
                <Field label="Date" name="date" type="date" value={date} error={fieldErrors.date}
                    onChange={(e) => setDate(e.target.value)} />
            </div>
            <Field label="Description (optional)" name="description" maxLength={250} placeholder="e.g. Groceries at Keells"
                value={description} error={fieldErrors.description} onChange={(e) => setDescription(e.target.value)} />

            <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving…" : isEdit ? "Save changes" : "Add transaction"}
                </Button>
                <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}