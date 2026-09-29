using System.ComponentModel.DataAnnotations;
using FinTrack.Api.Entities;

namespace FinTrack.Api.DTOs.Accounts;

public class CreateAccountRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, EnumDataType(typeof(AccountType))]
    public AccountType Type { get; set; }

    [Range(0, 1_000_000_000)]
    public decimal InitialBalance { get; set; }
}