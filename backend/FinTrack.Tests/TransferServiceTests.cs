using FinTrack.Api.Common;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Transfers;
using FinTrack.Api.Entities;
using FinTrack.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Tests;

public class TransferServiceTests
{
    private readonly AppDbContext _db = TestDb.Create();
    private readonly TransferService _service;

    public TransferServiceTests() => _service = new TransferService(_db);

    private static TransferRequest Request(int fromId, int toId, decimal amount) => new()
    {
        FromAccountId = fromId,
        ToAccountId = toId,
        Amount = amount,
        Date = new DateTime(2026, 9, 30)
    };

    [Fact]
    public async Task Transfer_MovesMoneyAndLinksBothSides()
    {
        var cash = TestDb.AddAccount(_db, 1, "Cash", 5000m);
        var savings = TestDb.AddAccount(_db, 1, "Savings", 0m);

        var result = await _service.CreateAsync(1, Request(cash.Id, savings.Id, 3000m));

        Assert.Equal(2000m, result.FromAccountBalance);
        Assert.Equal(3000m, result.ToAccountBalance);

        var sides = await _db.Transactions.Where(t => t.TransferId == result.TransferId).ToListAsync();
        Assert.Equal(2, sides.Count);
        Assert.Contains(sides, t => t.Type == TransactionType.TransferOut && t.AccountId == cash.Id);
        Assert.Contains(sides, t => t.Type == TransactionType.TransferIn && t.AccountId == savings.Id);
    }

    [Fact]
    public async Task Transfer_WithInsufficientBalance_ThrowsAndChangesNothing()
    {
        var cash = TestDb.AddAccount(_db, 1, "Cash", 1000m);
        var savings = TestDb.AddAccount(_db, 1, "Savings", 0m);

        await Assert.ThrowsAsync<BadRequestException>(
            () => _service.CreateAsync(1, Request(cash.Id, savings.Id, 5000m)));

        _db.ChangeTracker.Clear(); // read fresh values from the database
        Assert.Equal(1000m, (await _db.Accounts.FindAsync(cash.Id))!.Balance);
        Assert.Equal(0m, (await _db.Accounts.FindAsync(savings.Id))!.Balance);
        Assert.Empty(_db.Transactions);
    }

    [Fact]
    public async Task Transfer_ToAnotherUsersAccount_ThrowsNotFound()
    {
        var mine = TestDb.AddAccount(_db, 1, "Cash", 5000m);
        var theirs = TestDb.AddAccount(_db, 2, "Their Account", 0m);

        await Assert.ThrowsAsync<NotFoundException>(
            () => _service.CreateAsync(1, Request(mine.Id, theirs.Id, 100m)));
    }

    [Fact]
    public async Task Transfer_ToSameAccount_ThrowsBadRequest()
    {
        var cash = TestDb.AddAccount(_db, 1, "Cash", 5000m);

        await Assert.ThrowsAsync<BadRequestException>(
            () => _service.CreateAsync(1, Request(cash.Id, cash.Id, 100m)));
    }
}