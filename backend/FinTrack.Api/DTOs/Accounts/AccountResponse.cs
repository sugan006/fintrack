using FinTrack.Api.Entities;

namespace FinTrack.Api.DTOs.Accounts;

public record AccountResponse(int Id, string Name, AccountType Type, decimal Balance, string Currency, DateTime CreatedAt);