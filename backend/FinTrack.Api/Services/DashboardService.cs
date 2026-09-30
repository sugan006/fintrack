using FinTrack.Api.Common;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Dashboard;
using FinTrack.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Services;

public class DashboardService(AppDbContext db) : IDashboardService
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(int userId, int year, int month)
{
    if (month is < 1 or > 12 || year is < 2000 or > 2100)
        throw new BadRequestException("Invalid year or month.");

    var start = new DateTime(year, month, 1);
    var end = start.AddMonths(1);

    var totalBalance = await db.Accounts
        .Where(a => a.UserId == userId)
        .SumAsync(a => a.Balance);

    var monthTransactions = db.Transactions
        .AsNoTracking()
        .Where(t => t.Account.UserId == userId && t.Date >= start && t.Date < end);

    // Transfers are excluded: moving money between your own accounts
    // is neither income nor spending.
    var totalIncome = await monthTransactions
        .Where(t => t.Type == TransactionType.Income)
        .SumAsync(t => t.Amount);

    var totalExpense = await monthTransactions
        .Where(t => t.Type == TransactionType.Expense)
        .SumAsync(t => t.Amount);

    var spendingTotals = await monthTransactions
        .Where(t => t.Type == TransactionType.Expense)
        .GroupBy(t => t.CategoryId)
        .Select(g => new { CategoryId = g.Key, Amount = g.Sum(t => t.Amount) })
        .ToListAsync();

    var categoryNames = await db.Categories
        .AsNoTracking()
        .ToDictionaryAsync(c => c.Id, c => c.Name);

    var spendingByCategory = spendingTotals
        .Select(s => new CategorySpending(
            s.CategoryId,
            s.CategoryId is int id && categoryNames.TryGetValue(id, out var name) ? name : "Uncategorized",
            s.Amount))
        .OrderByDescending(s => s.Amount)
        .ToList();

    return new DashboardSummaryResponse(
        year, month, totalBalance, totalIncome, totalExpense,
        totalIncome - totalExpense, spendingByCategory);
}
}