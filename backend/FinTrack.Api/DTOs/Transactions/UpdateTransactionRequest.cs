using System.ComponentModel.DataAnnotations;
using FinTrack.Api.Entities;

namespace FinTrack.Api.DTOs.Transactions;

public class UpdateTransactionRequest
{
    public int? CategoryId { get; set; }

    [Required, EnumDataType(typeof(TransactionType))]
    public TransactionType Type { get; set; }

    [Range(typeof(decimal), "0.01", "1000000000")]
    public decimal Amount { get; set; }

    [Required]
    public DateTime? Date { get; set; }

    [MaxLength(250)]
    public string? Description { get; set; }
}