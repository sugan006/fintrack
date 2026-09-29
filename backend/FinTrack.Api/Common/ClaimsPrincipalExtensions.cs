using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace FinTrack.Api.Common;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new UnauthorizedAccessException("User ID claim is missing."));
}