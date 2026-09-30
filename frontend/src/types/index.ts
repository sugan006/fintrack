// Enums (sent as strings by the API)
export type AccountType = "Cash" | "Bank" | "Savings";
export type CategoryType = "Income" | "Expense";
export type TransactionType = "Income" | "Expense" | "TransferIn" | "TransferOut";

// Auth
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  userId: number;
  fullName: string;
  email: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  fullName: string;
}

// Accounts
export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  createdAt: string;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  initialBalance: number;
}

export interface UpdateAccountRequest {
  name: string;
  type: AccountType;
}

// Categories
export interface Category {
  id: number;
  name: string;
  type: CategoryType;
}

// Transactions
export interface Transaction {
  id: number;
  accountId: number;
  accountName: string;
  categoryId: number | null;
  categoryName: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  description: string | null;
  createdAt: string;
  transferId: string | null;
}

export interface TransactionRequest {
  categoryId: number | null;
  type: "Income" | "Expense";
  amount: number;
  date: string;
  description?: string;
}

export interface CreateTransactionRequest extends TransactionRequest {
  accountId: number;
}

export interface TransactionQuery {
  accountId?: number;
  type?: TransactionType;
  categoryId?: number;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Transfers
export interface TransferRequest {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  date: string;
  description?: string;
}

export interface TransferResponse {
  transferId: string;
  amount: number;
  date: string;
  fromAccountId: number;
  fromAccountBalance: number;
  toAccountId: number;
  toAccountBalance: number;
}

// Dashboard
export interface CategorySpending {
  categoryId: number | null;
  categoryName: string;
  amount: number;
}

export interface DashboardSummary {
  year: number;
  month: number;
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
  spendingByCategory: CategorySpending[];
}

// Error format returned by the API (ProblemDetails)
export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}