using System.ComponentModel.DataAnnotations;

namespace FinTrack.Api.DTOs.Transactions;

public class CreateTransactionRequest : UpdateTransactionRequest
{
    [Range(1, int.MaxValue)]
    public int AccountId { get; set; }
}