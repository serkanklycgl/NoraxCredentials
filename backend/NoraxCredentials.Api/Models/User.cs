using System.ComponentModel.DataAnnotations;

namespace NoraxCredentials.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Role { get; set; } = "Admin";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
