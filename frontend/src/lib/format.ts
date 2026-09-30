const currencyFormatter = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
    return currencyFormatter.format(amount); // e.g. "LKR 5,000.00"
}

export function formatDate(value: string): string {
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }); // e.g. "30 Sep 2026"
}

// Today's date as YYYY-MM-DD, the format date inputs and the API expect
export function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}