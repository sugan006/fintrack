namespace FinTrack.Api.DTOs.Transfers;

public record TransferResponse(
    Guid TransferId, decimal Amount, DateTime Date,
    int FromAccountId, decimal FromAccountBalance,
    int ToAccountId, decimal ToAccountBalance);