using FinTrack.Api.Common;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Transactions;
using FinTrack.Api.Entities;
using FinTrack.Api.Services;

namespace FinTrack.Tests;

public class TransactionServiceTests
{
    // Seeded category IDs from AppDbContext
    private const int SalaryCategory = 1;
    private const int FoodCategory = 3;

    private readonly AppDbContext _db = TestDb.Create();
    private readonly TransactionService _service;

    public TransactionServiceTests() => _service = new TransactionService(_db);

    private static CreateTransactionRequest NewTransaction(
        int accountId, TransactionType type, decimal amount, int? categoryId) => new()
        {
            AccountId = accountId,
            Type = type,
            Amount = amount,
            CategoryId = categoryId,
            Date = new DateTime(2026, 9, 30)
        };

    private async Task<decimal> BalanceOf(int accountId)
    {
        _db.ChangeTracker.Clear();
        return (await _db.Accounts.FindAsync(accountId))!.Balance;
    }

    [Fact]
    public async Task CreateIncome_IncreasesBalance()
    {
        var account = TestDb.AddAccount(_db, 1, "Cash", 5000m);

        var result = await _service.CreateAsync(1,
            NewTransaction(account.Id, TransactionType.Income, 10000m, SalaryCategory));

        Assert.Equal(15000m, await BalanceOf(account.Id));
        Assert.Equal("Salary", result.CategoryName);
    }

    [Fact]
    public async Task CreateExpense_MoreThanBalance_Throws()
    {
        var account = TestDb.AddAccount(_db, 1, "Cash", 1000m);

        await Assert.ThrowsAsync<BadRequestException>(() => _service.CreateAsync(1,
            NewTransaction(account.Id, TransactionType.Expense, 5000m, FoodCategory)));

        Assert.Equal(1000m, await BalanceOf(account.Id));
    }

    [Fact]
    public async Task CreateExpense_WithIncomeCategory_Throws()
    {
        var account = TestDb.AddAccount(_db, 1, "Cash", 5000m);

        await Assert.ThrowsAsync<BadRequestException>(() => _service.CreateAsync(1,
            NewTransaction(account.Id, TransactionType.Expense, 100m, SalaryCategory)));
    }

    [Fact]
    public async Task UpdateExpense_AdjustsBalanceByTheDifference()
    {
        var account = TestDb.AddAccount(_db, 1, "Cash", 5000m);
        var created = await _service.CreateAsync(1,
            NewTransaction(account.Id, TransactionType.Expense, 2000m, FoodCategory)); // balance 3000

        await _service.UpdateAsync(1, created.Id, new UpdateTransactionRequest
        {
            Type = TransactionType.Expense,
            Amount = 2500m,
            CategoryId = FoodCategory,
            Date = new DateTime(2026, 9, 30)
        });

        Assert.Equal(2500m, await BalanceOf(account.Id));
    }

    [Fact]
    public async Task DeleteExpense_RestoresBalance()
    {
        var account = TestDb.AddAccount(_db, 1, "Cash", 5000m);
        var created = await _service.CreateAsync(1,
            NewTransaction(account.Id, TransactionType.Expense, 2000m, FoodCategory));

        await _service.DeleteAsync(1, created.Id);

        Assert.Equal(5000m, await BalanceOf(account.Id));
    }

    [Fact]
    public async Task GetById_ForAnotherUsersTransaction_ReturnsNull()
    {
        var account = TestDb.AddAccount(_db, 1, "Cash", 5000m);
        var created = await _service.CreateAsync(1,
            NewTransaction(account.Id, TransactionType.Income, 100m, SalaryCategory));

        var result = await _service.GetByIdAsync(2, created.Id);

        Assert.Null(result);
    }
}