using FinTrack.Api.DTOs.Transfers;

namespace FinTrack.Api.Services;

public interface ITransferService
{
    Task<TransferResponse> CreateAsync(int userId, TransferRequest request);
}