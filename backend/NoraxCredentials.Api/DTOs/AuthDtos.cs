using System.ComponentModel.DataAnnotations;

namespace NoraxCredentials.Api.DTOs;

public record AuthResponseDto(string Token, UserProfileDto User);
public record UserProfileDto(Guid Id, string Email, string Role);

public class RegisterRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Role { get; set; } = "Admin";
}

public class LoginRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
