using FinTrack.Api.Entities;

namespace FinTrack.Api.DTOs.Categories;

public record CategoryResponse(int Id, string Name, CategoryType Type);