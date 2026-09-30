using FinTrack.Api.Common;
using FinTrack.Api.DTOs.Dashboard;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet("summary")]
public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(
        [FromQuery] int? year, [FromQuery] int? month)
{
    var now = DateTime.UtcNow;
    return Ok(await dashboardService.GetSummaryAsync(
        User.GetUserId(), year ?? now.Year, month ?? now.Month));
}
}