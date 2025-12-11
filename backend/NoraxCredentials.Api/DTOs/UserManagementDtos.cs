using System.ComponentModel.DataAnnotations;

namespace NoraxCredentials.Api.DTOs;

public record UserDto(Guid Id, string Email, string Role, IReadOnlyCollection<Guid> CredentialIds);

public class CreateUserDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Role { get; set; } = "User";
}

public class UpdateUserDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Role { get; set; } = "User";

    // Optional; if null or empty, password is unchanged
    [MinLength(6)]
    public string? Password { get; set; }
}

public class UpdateUserAccessDto
{
    public List<Guid> CredentialIds { get; set; } = new();
}
