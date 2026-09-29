using FinTrack.Api.Common;
using FinTrack.Api.DTOs.Auth;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
{
    var result = await authService.RegisterAsync(request);
    if (result is null)
        return Problem(statusCode: StatusCodes.Status409Conflict, title: "Email is already registered.");

    return Ok(result);
}

[HttpPost("login")]
public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
{
    var result = await authService.LoginAsync(request);
    if (result is null)
        return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Invalid email or password.");

    return Ok(result);
}

[Authorize]
[HttpGet("me")]
public IActionResult Me() => Ok(new
{
    Id = User.GetUserId(),
    Email = User.FindFirst("email")?.Value,
    FullName = User.FindFirst("name")?.Value
});
}