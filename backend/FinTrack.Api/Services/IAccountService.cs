using FinTrack.Api.DTOs.Accounts;

namespace FinTrack.Api.Services;

public enum DeleteAccountResult { Deleted, NotFound, HasTransactions }

public interface IAccountService
{
    Task<List<AccountResponse>> GetAllAsync(int userId);
    Task<AccountResponse?> GetByIdAsync(int userId, int id);
    Task<AccountResponse> CreateAsync(int userId, CreateAccountRequest request);
    Task<AccountResponse?> UpdateAsync(int userId, int id, UpdateAccountRequest request);
    Task<DeleteAccountResult> DeleteAsync(int userId, int id);
}