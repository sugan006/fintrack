using System.Linq.Expressions;
using FinTrack.Api.Common;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Transactions;
using FinTrack.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Services;

public class TransactionService(AppDbContext db) : ITransactionService
{
    // Translated to SQL, so account and category names come from a JOIN
    private static readonly Expression<Func<Transaction, TransactionResponse>> Projection = t =>
        new TransactionResponse(
            t.Id, t.AccountId, t.Account.Name, t.CategoryId,
            t.Category != null ? t.Category.Name : null,
            t.Type, t.Amount, t.Date, t.Description, t.CreatedAt);

public async Task<TransactionResponse?> GetByIdAsync(int userId, int id) =>
    await db.Transactions
        .AsNoTracking()
        .Where(t => t.Id == id && t.Account.UserId == userId)
        .Select(Projection)
        .SingleOrDefaultAsync();

public async Task<TransactionResponse> CreateAsync(int userId, CreateTransactionRequest request)
{
    EnsureIncomeOrExpense(request.Type);

    var account = await db.Accounts
        .SingleOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId)
        ?? throw new NotFoundException("Account not found.");

    await ValidateCategoryAsync(request.CategoryId, request.Type);

    var newBalance = account.Balance + SignedAmount(request.Type, request.Amount);
    if (newBalance < 0)
        throw new BadRequestException("Insufficient balance for this expense.");

    var transaction = new Transaction
    {
        AccountId = account.Id,
        CategoryId = request.CategoryId,
        Type = request.Type,
        Amount = request.Amount,
        Date = request.Date!.Value,
        Description = request.Description?.Trim()
    };

    account.Balance = newBalance;
    db.Transactions.Add(transaction);
    await db.SaveChangesAsync(); // one SaveChanges = one atomic DB transaction

    return (await GetByIdAsync(userId, transaction.Id))!;
}

public async Task<TransactionResponse> UpdateAsync(int userId, int id, UpdateTransactionRequest request)
{
    var transaction = await db.Transactions
        .Include(t => t.Account)
        .SingleOrDefaultAsync(t => t.Id == id && t.Account.UserId == userId)
        ?? throw new NotFoundException("Transaction not found.");

    if (IsTransfer(transaction.Type))
        throw new BadRequestException("Transfer transactions can't be edited.");

    EnsureIncomeOrExpense(request.Type);
    await ValidateCategoryAsync(request.CategoryId, request.Type);

    // Undo the old effect on the balance, then apply the new one
    var account = transaction.Account;
    var newBalance = account.Balance
        - SignedAmount(transaction.Type, transaction.Amount)
        + SignedAmount(request.Type, request.Amount);

    if (newBalance < 0)
        throw new BadRequestException("This change would make the account balance negative.");

    transaction.CategoryId = request.CategoryId;
    transaction.Type = request.Type;
    transaction.Amount = request.Amount;
    transaction.Date = request.Date!.Value;
    transaction.Description = request.Description?.Trim();
    account.Balance = newBalance;

    await db.SaveChangesAsync();
    return (await GetByIdAsync(userId, transaction.Id))!;
}

public async Task DeleteAsync(int userId, int id)
{
    var transaction = await db.Transactions
        .Include(t => t.Account)
        .SingleOrDefaultAsync(t => t.Id == id && t.Account.UserId == userId)
        ?? throw new NotFoundException("Transaction not found.");

    if (IsTransfer(transaction.Type))
        throw new BadRequestException("Transfer transactions can't be deleted individually.");

    var newBalance = transaction.Account.Balance - SignedAmount(transaction.Type, transaction.Amount);
    if (newBalance < 0)
        throw new BadRequestException("Deleting this income would make the account balance negative.");

    transaction.Account.Balance = newBalance;
    db.Transactions.Remove(transaction);
    await db.SaveChangesAsync();
}

private static decimal SignedAmount(TransactionType type, decimal amount) =>
    type is TransactionType.Income or TransactionType.TransferIn ? amount : -amount;

private static bool IsTransfer(TransactionType type) =>
    type is TransactionType.TransferIn or TransactionType.TransferOut;

private static void EnsureIncomeOrExpense(TransactionType type)
{
    if (IsTransfer(type))
        throw new BadRequestException("Use the transfers endpoint to move money between accounts.");
}

private async Task ValidateCategoryAsync(int? categoryId, TransactionType type)
{
    if (categoryId is null) return;

    var category = await db.Categories.AsNoTracking().SingleOrDefaultAsync(c => c.Id == categoryId)
        ?? throw new BadRequestException("Category not found.");

    var expected = type == TransactionType.Income ? CategoryType.Income : CategoryType.Expense;
    if (category.Type != expected)
        throw new BadRequestException($"Category '{category.Name}' can't be used for {type} transactions.");
}
}