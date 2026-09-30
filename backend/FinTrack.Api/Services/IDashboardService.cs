using FinTrack.Api.DTOs.Dashboard;

namespace FinTrack.Api.Services;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(int userId, int year, int month);
}