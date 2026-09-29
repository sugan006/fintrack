using System.ComponentModel.DataAnnotations;
using FinTrack.Api.Entities;

namespace FinTrack.Api.DTOs.Transactions;

public class TransactionQuery
{
    public int? AccountId { get; set; }
    public TransactionType? Type { get; set; }
    public int? CategoryId { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }

    [MaxLength(100)]
    public string? Search { get; set; }

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}