using System.ComponentModel.DataAnnotations;

namespace NoraxCredentials.Api.DTOs;

public record CategoryResponseDto(Guid Id, string Name, string? Description);

public class CreateCategoryDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}

public class UpdateCategoryDto : CreateCategoryDto
{
}
