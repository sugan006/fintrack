using FinTrack.Api.Common;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Transfers;
using FinTrack.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Services;

public class TransferService(AppDbContext db) : ITransferService
{
    public async Task<TransferResponse> CreateAsync(int userId, TransferRequest request)
{
    if (request.FromAccountId == request.ToAccountId)
        throw new BadRequestException("Choose two different accounts.");

    // Load both accounts in one query, only if they belong to this user
    var accounts = await db.Accounts
        .Where(a => a.UserId == userId &&
                    (a.Id == request.FromAccountId || a.Id == request.ToAccountId))
        .ToListAsync();

    var from = accounts.SingleOrDefault(a => a.Id == request.FromAccountId)
        ?? throw new NotFoundException("Source account not found.");
    var to = accounts.SingleOrDefault(a => a.Id == request.ToAccountId)
        ?? throw new NotFoundException("Destination account not found.");

    if (from.Currency != to.Currency)
        throw new BadRequestException("Transfers between different currencies aren't supported.");

    if (from.Balance < request.Amount)
        throw new BadRequestException("Insufficient balance for this transfer.");

    var transferId = Guid.NewGuid();
    var date = request.Date!.Value;
    var note = request.Description?.Trim();

    db.Transactions.AddRange(
        new Transaction
        {
            AccountId = from.Id,
            Type = TransactionType.TransferOut,
            Amount = request.Amount,
            Date = date,
            Description = string.IsNullOrEmpty(note) ? $"Transfer to {to.Name}" : note,
            TransferId = transferId
        },
        new Transaction
        {
            AccountId = to.Id,
            Type = TransactionType.TransferIn,
            Amount = request.Amount,
            Date = date,
            Description = string.IsNullOrEmpty(note) ? $"Transfer from {from.Name}" : note,
            TransferId = transferId
        });

    from.Balance -= request.Amount;
    to.Balance += request.Amount;

    // Both records and both balances are saved atomically.
    // RowVersion makes this fail if either account changed since we read it.
    await db.SaveChangesAsync();

    return new TransferResponse(transferId, request.Amount, date,
        from.Id, from.Balance, to.Id, to.Balance);
}
}