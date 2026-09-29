using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Accounts;
using FinTrack.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Services;

public class AccountService(AppDbContext db) : IAccountService
{
    public async Task<List<AccountResponse>> GetAllAsync(int userId) =>
        await db.Accounts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderBy(a => a.Name)
            .Select(a => ToResponse(a))
            .ToListAsync();

public async Task<AccountResponse?> GetByIdAsync(int userId, int id) =>
    await db.Accounts
        .AsNoTracking()
        .Where(a => a.Id == id && a.UserId == userId)
        .Select(a => ToResponse(a))
        .SingleOrDefaultAsync();

public async Task<AccountResponse> CreateAsync(int userId, CreateAccountRequest request)
{
    var account = new Account
    {
        UserId = userId,
        Name = request.Name.Trim(),
        Type = request.Type,
        Balance = request.InitialBalance
    };

    db.Accounts.Add(account);
    await db.SaveChangesAsync();
    return ToResponse(account);
}

public async Task<AccountResponse?> UpdateAsync(int userId, int id, UpdateAccountRequest request)
{
    var account = await db.Accounts.SingleOrDefaultAsync(a => a.Id == id && a.UserId == userId);
    if (account is null) return null;

    account.Name = request.Name.Trim();
    account.Type = request.Type;
    await db.SaveChangesAsync();
    return ToResponse(account);
}

public async Task<DeleteAccountResult> DeleteAsync(int userId, int id)
{
    var account = await db.Accounts.SingleOrDefaultAsync(a => a.Id == id && a.UserId == userId);
    if (account is null) return DeleteAccountResult.NotFound;

    if (await db.Transactions.AnyAsync(t => t.AccountId == id))
        return DeleteAccountResult.HasTransactions;

    db.Accounts.Remove(account);
    await db.SaveChangesAsync();
    return DeleteAccountResult.Deleted;
}

private static AccountResponse ToResponse(Account a) =>
    new(a.Id, a.Name, a.Type, a.Balance, a.Currency, a.CreatedAt);
}