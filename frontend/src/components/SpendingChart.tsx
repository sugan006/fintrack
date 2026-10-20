"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/format";
import type { CategorySpending } from "@/types";

export const CHART_COLORS = ["#059669", "#0284c7", "#d97706", "#7c3aed", "#db2777", "#dc2626", "#0d9488", "#65a30d"];

export default function SpendingChart({ data }: { data: CategorySpending[] }) {
    return (
        <div className="h-56 w-full" role="img" aria-label="Spending by category chart">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="amount" nameKey="categoryName" innerRadius="55%" outerRadius="90%" paddingAngle={2}>
                        {data.map((item, index) => (
                            <Cell key={item.categoryName} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(Number(value))} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}