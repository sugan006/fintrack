namespace FinTrack.Api.DTOs.Auth;

public record AuthResponse(string Token, DateTime ExpiresAt, int UserId, string FullName, string Email);