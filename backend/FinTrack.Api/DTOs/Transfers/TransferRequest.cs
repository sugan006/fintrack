using System.ComponentModel.DataAnnotations;

namespace FinTrack.Api.DTOs.Transfers;

public class TransferRequest
{
    [Range(1, int.MaxValue)]
    public int FromAccountId { get; set; }

    [Range(1, int.MaxValue)]
    public int ToAccountId { get; set; }

    [Range(typeof(decimal), "0.01", "1000000000")]
    public decimal Amount { get; set; }

    [Required]
    public DateTime? Date { get; set; }

    [MaxLength(250)]
    public string? Description { get; set; }
}