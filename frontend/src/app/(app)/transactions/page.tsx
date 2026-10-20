"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { Account, Category, PagedResult, Transaction, TransactionType } from "@/types";
import TransactionForm, { type TransactionFormValues } from "@/components/TransactionForm";
import { Button, ErrorAlert, Field, SelectField, Spinner } from "@/components/ui";

const PAGE_SIZE = 10;

interface Filters {
    accountId: string;
    type: string;
    categoryId: string;
    from: string;
    to: string;
    search: string;
}

const EMPTY_FILTERS: Filters = { accountId: "", type: "", categoryId: "", from: "", to: "", search: "" };

const TYPE_LABELS: Record<TransactionType, string> = {
    Income: "Income",
    Expense: "Expense",
    TransferIn: "Transfer in",
    TransferOut: "Transfer out",
};

function isTransfer(t: Transaction) {
    return t.type === "TransferIn" || t.type === "TransferOut";
}

function isMoneyIn(t: Transaction) {
    return t.type === "Income" || t.type === "TransferIn";
}

// "new" shows the create form, a number shows the edit form for that transaction
type FormMode = "new" | number | null;

export default function TransactionsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [result, setResult] = useState<PagedResult<Transaction> | null>(null);
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [searchText, setSearchText] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formMode, setFormMode] = useState<FormMode>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Accounts and categories are needed for the filters and the form
    useEffect(() => {
        Promise.all([api.getAccounts(), api.getCategories()])
            .then(([accountList, categoryList]) => {
                setAccounts(accountList);
                setCategories(categoryList);
            })
            .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your accounts."));
    }, []);

    const loadTransactions = useCallback(async () => {
        try {
            setResult(await api.getTransactions({
                accountId: filters.accountId ? Number(filters.accountId) : undefined,
                type: (filters.type || undefined) as TransactionType | undefined,
                categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
                from: filters.from || undefined,
                to: filters.to || undefined,
                search: filters.search || undefined,
                page,
                pageSize: PAGE_SIZE,
            }));
            setError(null);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not load transactions.");
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reload when filters or page change
        loadTransactions();
    }, [loadTransactions]);

    function updateFilter(name: keyof Filters, value: string) {
        setFilters((current) => ({ ...current, [name]: value }));
        setPage(1); // new filters start again from the first page
    }

    function handleSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        updateFilter("search", searchText.trim());
    }

    function clearFilters() {
        setFilters(EMPTY_FILTERS);
        setSearchText("");
        setPage(1);
    }

    async function handleCreate(values: TransactionFormValues) {
        await api.createTransaction(values);
        setFormMode(null);
        setPage(1);
        await loadTransactions();
    }

    async function handleUpdate(id: number, values: TransactionFormValues) {
        const { categoryId, type, amount, date, description } = values;
        await api.updateTransaction(id, { categoryId, type, amount, date, description });
        setFormMode(null);
        await loadTransactions();
    }

    async function handleDelete(transaction: Transaction) {
        const label = transaction.description || transaction.categoryName || TYPE_LABELS[transaction.type];
        if (!window.confirm(`Delete "${label}" (${formatMoney(transaction.amount)})? The account balance will be updated.`)) return;
        setDeletingId(transaction.id);
        setError(null);
        try {
            await api.deleteTransaction(transaction.id);
            await loadTransactions();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not delete the transaction.");
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) return <Spinner label="Loading transactions…" />;

    const transactions = result?.items ?? [];
    const editing = typeof formMode === "number" ? transactions.find((t) => t.id === formMode) : undefined;
    const hasFilters = Object.values(filters).some((v) => v !== "");

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Transactions</h1>
                    <p className="text-sm text-zinc-500">Income, expenses and transfers across your accounts.</p>
                </div>
                {formMode === null && accounts.length > 0 && (
                    <Button onClick={() => setFormMode("new")}>Add transaction</Button>
                )}
            </div>

            <ErrorAlert message={error} />

            {accounts.length === 0 && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    You need an account before adding transactions. <Link href="/accounts" className="font-medium underline">Add one here</Link>.
                </p>
            )}

            {formMode === "new" && (
                <TransactionForm accounts={accounts} categories={categories}
                    onSubmit={handleCreate} onCancel={() => setFormMode(null)} />
            )}
            {editing && (
                <TransactionForm key={editing.id} accounts={accounts} categories={categories} transaction={editing}
                    onSubmit={(values) => handleUpdate(editing.id, values)} onCancel={() => setFormMode(null)} />
            )}

            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <SelectField label="Account" name="filterAccount" value={filters.accountId}
                        onChange={(e) => updateFilter("accountId", e.target.value)}>
                        <option value="">All accounts</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </SelectField>
                    <SelectField label="Type" name="filterType" value={filters.type}
                        onChange={(e) => updateFilter("type", e.target.value)}>
                        <option value="">All types</option>
                        {(Object.keys(TYPE_LABELS) as TransactionType[]).map((t) => (
                            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                        ))}
                    </SelectField>
                    <SelectField label="Category" name="filterCategory" value={filters.categoryId}
                        onChange={(e) => updateFilter("categoryId", e.target.value)}>
                        <option value="">All categories</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                    </SelectField>
                    <Field label="From" name="filterFrom" type="date" value={filters.from}
                        onChange={(e) => updateFilter("from", e.target.value)} />
                    <Field label="To" name="filterTo" type="date" value={filters.to}
                        onChange={(e) => updateFilter("to", e.target.value)} />
                </div>
                <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
                    <div className="min-w-48 flex-1">
                        <Field label="Search description" name="filterSearch" maxLength={100} value={searchText}
                            placeholder="e.g. rent" onChange={(e) => setSearchText(e.target.value)} />
                    </div>
                    <Button type="submit" variant="secondary">Search</Button>
                    {hasFilters && <Button type="button" variant="secondary" onClick={clearFilters}>Clear filters</Button>}
                </form>
            </div>

            {/* List */}
            {transactions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
                    <p className="font-medium">{hasFilters ? "No transactions match these filters" : "No transactions yet"}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                        {hasFilters ? "Try changing or clearing the filters." : "Add your first income or expense to get started."}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead className="border-b border-zinc-200 text-left text-xs uppercase text-zinc-500 dark:border-zinc-800">
                            <tr>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">Description</th>
                                <th className="px-4 py-3 font-medium">Category</th>
                                <th className="px-4 py-3 font-medium">Account</th>
                                <th className="px-4 py-3 text-right font-medium">Amount</th>
                                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {transactions.map((t) => (
                                <tr key={t.id}>
                                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{formatDate(t.date)}</td>
                                    <td className="px-4 py-3">
                                        {t.description || <span className="text-zinc-400">—</span>}
                                        {isTransfer(t) && (
                                            <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                                {TYPE_LABELS[t.type]}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-500">{t.categoryName ?? "—"}</td>
                                    <td className="px-4 py-3 text-zinc-500">{t.accountName}</td>
                                    <td className={`whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums ${isMoneyIn(t) ? "text-emerald-600" : "text-red-600"}`}>
                                        {isMoneyIn(t) ? "+" : "−"}{formatMoney(t.amount)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        {isTransfer(t) ? (
                                            <span className="text-xs text-zinc-400">Transfer</span>
                                        ) : (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setFormMode(t.id)} disabled={formMode !== null}
                                                    className="text-emerald-700 hover:underline disabled:opacity-40 dark:text-emerald-400">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(t)} disabled={deletingId === t.id}
                                                    className="text-red-600 hover:underline disabled:opacity-40">
                                                    {deletingId === t.id ? "Deleting…" : "Delete"}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paging */}
            {result && result.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-zinc-500">
                        Page {result.page} of {result.totalPages} · {result.totalCount} transactions
                    </p>
                    <div className="flex gap-2">
                        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                        <Button variant="secondary" disabled={page >= result.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}