import type {
    Account, AuthResponse, Category, CategoryType, CreateAccountRequest,
    CreateTransactionRequest, CurrentUser, DashboardSummary, LoginRequest,
    PagedResult, ProblemDetails, RegisterRequest, Transaction, TransactionQuery,
    TransactionRequest, TransferRequest, TransferResponse, UpdateAccountRequest,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5249";
const TOKEN_KEY = "fintrack_token";

// ---- Token storage ----
// Demo only: production should use httpOnly cookies with refresh tokens.
export function getToken(): string | null {
    if (typeof window === "undefined") return null; // not available during server rendering
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// ---- Errors ----
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public fieldErrors?: Record<string, string[]>,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// ---- Core request function ----
async function request<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    // Token expired or invalid: log out and go to the login page
    if (response.status === 401 && token) {
        clearToken();
        // A full reload is intentional here: it clears all in-memory state from the expired session.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
        throw new ApiError("Your session has expired. Please log in again.", 401);
    }

    if (!response.ok) {
        let problem: ProblemDetails | null = null;
        try {
            problem = await response.json();
        } catch {
            // response had no JSON body
        }

        const message = problem?.errors
            ? Object.values(problem.errors).flat().join(" ")
            : problem?.title ?? `Request failed with status ${response.status}.`;

        throw new ApiError(message, response.status, problem?.errors);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
}

function toQueryString(query: object): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== "") params.append(key, String(value));
    }
    const text = params.toString();
    return text ? `?${text}` : "";
}

// ---- Endpoints ----
export const api = {
    // Auth
    register: (data: RegisterRequest) =>
        request<AuthResponse>("/api/auth/register", { method: "POST", body: data }),
    login: (data: LoginRequest) =>
        request<AuthResponse>("/api/auth/login", { method: "POST", body: data }),
    me: () => request<CurrentUser>("/api/auth/me"),

    // Accounts
    getAccounts: () => request<Account[]>("/api/accounts"),
    getAccount: (id: number) => request<Account>(`/api/accounts/${id}`),
    createAccount: (data: CreateAccountRequest) =>
        request<Account>("/api/accounts", { method: "POST", body: data }),
    updateAccount: (id: number, data: UpdateAccountRequest) =>
        request<Account>(`/api/accounts/${id}`, { method: "PUT", body: data }),
    deleteAccount: (id: number) =>
        request<void>(`/api/accounts/${id}`, { method: "DELETE" }),

    // Categories
    getCategories: (type?: CategoryType) =>
        request<Category[]>(`/api/categories${toQueryString({ type })}`),

    // Transactions
    getTransactions: (query: TransactionQuery = {}) =>
        request<PagedResult<Transaction>>(`/api/transactions${toQueryString(query)}`),
    getTransaction: (id: number) => request<Transaction>(`/api/transactions/${id}`),
    createTransaction: (data: CreateTransactionRequest) =>
        request<Transaction>("/api/transactions", { method: "POST", body: data }),
    updateTransaction: (id: number, data: TransactionRequest) =>
        request<Transaction>(`/api/transactions/${id}`, { method: "PUT", body: data }),
    deleteTransaction: (id: number) =>
        request<void>(`/api/transactions/${id}`, { method: "DELETE" }),

    // Transfers
    createTransfer: (data: TransferRequest) =>
        request<TransferResponse>("/api/transfers", { method: "POST", body: data }),

    // Dashboard
    getDashboardSummary: (year?: number, month?: number) =>
        request<DashboardSummary>(`/api/dashboard/summary${toQueryString({ year, month })}`),
};