using System.Security.Claims;
using System.Text;
using FinTrack.Api.Common;
using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Auth;
using FinTrack.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace FinTrack.Api.Services;

public class AuthService(AppDbContext db, IOptions<JwtSettings> jwtOptions) : IAuthService
{
    private readonly JwtSettings _jwt = jwtOptions.Value;

public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
{
    var email = request.Email.Trim().ToLowerInvariant();

    if (await db.Users.AnyAsync(u => u.Email == email))
        return null; // email already registered

    var user = new User
    {
        FullName = request.FullName.Trim(),
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return CreateAuthResponse(user);
}

public async Task<AuthResponse?> LoginAsync(LoginRequest request)
{
    var email = request.Email.Trim().ToLowerInvariant();
    var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email);

    // Same result for unknown email and wrong password,
    // so attackers can't find out which emails are registered.
    if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        return null;

    return CreateAuthResponse(user);
}

private AuthResponse CreateAuthResponse(User user)
{
    var expiresAt = DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes);
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));

    var descriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(

        [
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Name, user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        ]),
            Expires = expiresAt,
            Issuer = _jwt.Issuer,
            Audience = _jwt.Audience,
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        };

var token = new JsonWebTokenHandler().CreateToken(descriptor);
        return new AuthResponse(token, expiresAt, user.Id, user.FullName, user.Email);
}
}