using FinTrack.Api.DTOs.Transactions;
using FinTrack.Api.Common;

namespace FinTrack.Api.Services;

public interface ITransactionService
{
    Task<TransactionResponse?> GetByIdAsync(int userId, int id);
    Task<PagedResult<TransactionResponse>> GetPagedAsync(int userId, TransactionQuery query);
    Task<TransactionResponse> CreateAsync(int userId, CreateTransactionRequest request);
    Task<TransactionResponse> UpdateAsync(int userId, int id, UpdateTransactionRequest request);
    Task DeleteAsync(int userId, int id);
}