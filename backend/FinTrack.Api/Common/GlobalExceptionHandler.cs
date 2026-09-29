using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Common;

public class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
{
    var (status, title) = exception switch
    {
        NotFoundException => (StatusCodes.Status404NotFound, exception.Message),
        BadRequestException => (StatusCodes.Status400BadRequest, exception.Message),
        ConflictException => (StatusCodes.Status409Conflict, exception.Message),
        DbUpdateConcurrencyException => (StatusCodes.Status409Conflict,
            "The record was changed by another request. Please reload and try again."),
        _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.")
    };

    if (status == StatusCodes.Status500InternalServerError)
        logger.LogError(exception, "Unhandled exception");

    httpContext.Response.StatusCode = status;
    return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
    {
        HttpContext = httpContext,
        Exception = exception,
        ProblemDetails = new ProblemDetails { Status = status, Title = title }
    });
}
}