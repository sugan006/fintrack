namespace FinTrack.Api.DTOs.Dashboard;

public record CategorySpending(int? CategoryId, string CategoryName, decimal Amount);

public record DashboardSummaryResponse(
    int Year, int Month,
    decimal TotalBalance, decimal TotalIncome, decimal TotalExpense, decimal Net,
    List<CategorySpending> SpendingByCategory);