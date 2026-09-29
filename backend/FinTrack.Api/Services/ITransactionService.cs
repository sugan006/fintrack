using FinTrack.Api.DTOs.Transactions;

namespace FinTrack.Api.Services;

public interface ITransactionService
{
    Task<TransactionResponse?> GetByIdAsync(int userId, int id);
    Task<TransactionResponse> CreateAsync(int userId, CreateTransactionRequest request);
    Task<TransactionResponse> UpdateAsync(int userId, int id, UpdateTransactionRequest request);
    Task DeleteAsync(int userId, int id);
}