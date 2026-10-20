"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Account } from "@/types";
import AccountForm, { type AccountFormValues } from "@/components/AccountForm";
import { Button, ErrorAlert, Spinner } from "@/components/ui";

const TYPE_BADGES: Record<Account["type"], string> = {
    Cash: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    Bank: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    Savings: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

// "new" shows the create form, a number shows the edit form for that account
type FormMode = "new" | number | null;

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formMode, setFormMode] = useState<FormMode>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const loadAccounts = useCallback(async () => {
        try {
            setAccounts(await api.getAccounts());
            setError(null);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not load your accounts.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
        loadAccounts();
    }, [loadAccounts]);

    async function handleCreate(values: AccountFormValues) {
        await api.createAccount(values);
        setFormMode(null);
        await loadAccounts();
    }

    async function handleUpdate(id: number, values: AccountFormValues) {
        await api.updateAccount(id, { name: values.name, type: values.type });
        setFormMode(null);
        await loadAccounts();
    }

    async function handleDelete(account: Account) {
        if (!window.confirm(`Delete "${account.name}"? This cannot be undone.`)) return;
        setDeletingId(account.id);
        setError(null);
        try {
            await api.deleteAccount(account.id);
            await loadAccounts();
        } catch (err) {
            // e.g. 409 when the account still has transactions
            setError(err instanceof ApiError ? err.message : "Could not delete the account.");
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) return <Spinner label="Loading accounts…" />;

    const total = accounts.reduce((sum, a) => sum + a.balance, 0);
    const editingAccount = typeof formMode === "number" ? accounts.find((a) => a.id === formMode) : undefined;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Accounts</h1>
                    <p className="text-sm text-zinc-500">
                        Total balance: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatMoney(total)}</span>
                    </p>
                </div>
                {formMode === null && <Button onClick={() => setFormMode("new")}>Add account</Button>}
            </div>

            <ErrorAlert message={error} />

            {formMode === "new" && (
                <AccountForm onSubmit={handleCreate} onCancel={() => setFormMode(null)} />
            )}
            {editingAccount && (
                <AccountForm key={editingAccount.id} account={editingAccount}
                    onSubmit={(values) => handleUpdate(editingAccount.id, values)}
                    onCancel={() => setFormMode(null)} />
            )}

            {accounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
                    <p className="font-medium">No accounts yet</p>
                    <p className="mt-1 text-sm text-zinc-500">Add your cash, bank or savings accounts to start tracking.</p>
                </div>
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => (
                        <li key={account.id}
                            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold">{account.name}</p>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGES[account.type]}`}>
                                    {account.type}
                                </span>
                            </div>
                            <p className={`text-2xl font-semibold tabular-nums ${account.balance < 0 ? "text-red-600" : ""}`}>
                                {formatMoney(account.balance)}
                            </p>
                            <div className="mt-auto flex gap-2">
                                <Button variant="secondary" className="px-3 py-1.5"
                                    onClick={() => setFormMode(account.id)} disabled={formMode !== null}>
                                    Edit
                                </Button>
                                <Button variant="danger" className="px-3 py-1.5"
                                    onClick={() => handleDelete(account)} disabled={deletingId === account.id}>
                                    {deletingId === account.id ? "Deleting…" : "Delete"}
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}