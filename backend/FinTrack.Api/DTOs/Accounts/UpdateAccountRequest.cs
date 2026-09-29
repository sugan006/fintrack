using System.ComponentModel.DataAnnotations;
using FinTrack.Api.Entities;

namespace FinTrack.Api.DTOs.Accounts;

public class UpdateAccountRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, EnumDataType(typeof(AccountType))]
    public AccountType Type { get; set; }
}