using FinTrack.Api.Data;
using FinTrack.Api.DTOs.Categories;
using FinTrack.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/categories")]
public class CategoriesController(AppDbContext db) : ControllerBase
{
    // Simple read-only lookup, so it queries the DbContext directly
    [HttpGet]
public async Task<ActionResult<List<CategoryResponse>>> GetAll([FromQuery] CategoryType? type) =>
        Ok(await db.Categories
            .AsNoTracking()
            .Where(c => type == null || c.Type == type)
            .OrderBy(c => c.Type).ThenBy(c => c.Name)
            .Select(c => new CategoryResponse(c.Id, c.Name, c.Type))
            .ToListAsync());
}