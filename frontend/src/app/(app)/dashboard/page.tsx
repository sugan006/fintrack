"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import type { DashboardSummary, Transaction } from "@/types";
import SpendingChart, { CHART_COLORS } from "@/components/SpendingChart";
import { Button, ErrorAlert, Spinner } from "@/components/ui";

function monthLabel(year: number, month: number) {
    return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function isMoneyIn(t: Transaction) {
    return t.type === "Income" || t.type === "TransferIn";
}

export default function DashboardPage() {
    const { user } = useAuth();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [recent, setRecent] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

    // Reload whenever the month changes
    useEffect(() => {
        let cancelled = false;
        Promise.all([api.getDashboardSummary(year, month), api.getTransactions({ pageSize: 5 })])
            .then(([summaryData, latest]) => {
                if (cancelled) return;
                setSummary(summaryData);
                setRecent(latest.items);
                setError(null);
            })
            .catch((err) => {
                if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load your dashboard.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        // Ignore a slow response if the user has already moved to another month
        return () => { cancelled = true; };
    }, [year, month]);

    function changeMonth(step: number) {
        const next = new Date(year, month - 1 + step, 1);
        setYear(next.getFullYear());
        setMonth(next.getMonth() + 1);
    }

    if (loading) return <Spinner label="Loading dashboard…" />;

    const spending = summary?.spendingByCategory ?? [];
    const spendingTotal = spending.reduce((sum, item) => sum + item.amount, 0);

    const cards = summary ? [
        { label: "Total balance", value: summary.totalBalance, tone: "" },
        { label: "Income this month", value: summary.totalIncome, tone: "text-emerald-600" },
        { label: "Expenses this month", value: summary.totalExpense, tone: "text-red-600" },
        { label: "Net", value: summary.net, tone: summary.net < 0 ? "text-red-600" : "text-emerald-600" },
    ] : [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Welcome, {user?.fullName}</h1>
                    <p className="text-sm text-zinc-500">Here&apos;s how your money moved in {monthLabel(year, month)}.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" className="px-3" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</Button>
                    <span className="min-w-36 text-center text-sm font-medium">{monthLabel(year, month)}</span>
                    <Button variant="secondary" className="px-3" onClick={() => changeMonth(1)} disabled={isCurrentMonth}
                        aria-label="Next month">›</Button>
                </div>
            </div>

            <ErrorAlert message={error} />

            {summary && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((card) => (
                        <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                            <p className="text-sm text-zinc-500">{card.label}</p>
                            <p className={`mt-1 text-xl font-semibold tabular-nums ${card.tone}`}>{formatMoney(card.value)}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="text-lg font-semibold">Spending by category</h2>
                    {spending.length === 0 ? (
                        <p className="py-10 text-center text-sm text-zinc-500">No expenses in {monthLabel(year, month)}.</p>
                    ) : (
                        <>
                            <SpendingChart data={spending} />
                            <ul className="flex flex-col gap-2 text-sm">
                                {spending.map((item, index) => (
                                    <li key={item.categoryName} className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-2">
                                            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                            {item.categoryName}
                                        </span>
                                        <span className="tabular-nums text-zinc-500">
                                            {formatMoney(item.amount)} · {Math.round((item.amount / spendingTotal) * 100)}%
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </section>

                <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Recent transactions</h2>
                        <Link href="/transactions" className="text-sm font-medium text-emerald-600 hover:underline">View all</Link>
                    </div>
                    {recent.length === 0 ? (
                        <p className="py-10 text-center text-sm text-zinc-500">
                            No transactions yet. <Link href="/transactions" className="font-medium text-emerald-600 hover:underline">Add one</Link>.
                        </p>
                    ) : (
                        <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
                            {recent.map((t) => (
                                <li key={t.id} className="flex items-center justify-between gap-4 py-3">
                                    <div>
                                        <p>{t.description || t.categoryName || t.type}</p>
                                        <p className="text-xs text-zinc-500">{formatDate(t.date)} · {t.accountName}</p>
                                    </div>
                                    <p className={`whitespace-nowrap font-medium tabular-nums ${isMoneyIn(t) ? "text-emerald-600" : "text-red-600"}`}>
                                        {isMoneyIn(t) ? "+" : "−"}{formatMoney(t.amount)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}