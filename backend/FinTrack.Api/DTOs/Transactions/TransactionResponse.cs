using FinTrack.Api.Entities;

namespace FinTrack.Api.DTOs.Transactions;

public record TransactionResponse(
    int Id, int AccountId, string AccountName, int? CategoryId, string? CategoryName,
    TransactionType Type, decimal Amount, DateTime Date, string? Description, DateTime CreatedAt,
    Guid? TransferId);