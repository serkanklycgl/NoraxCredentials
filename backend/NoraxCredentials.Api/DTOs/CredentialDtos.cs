using System.ComponentModel.DataAnnotations;

namespace NoraxCredentials.Api.DTOs;

public record CredentialResponseDto(
    Guid Id,
    Guid CategoryId,
    string Name,
    string? HostOrUrl,
    string? Username,
    string? Password,
    string? ConnectionString,
    string? Notes,
    string? AppName,
    string? AppLink,
    string? AccountFirstName,
    string? AccountLastName,
    string? AccountEmail,
    string? AccountRole,
    bool? ServerVpnRequired,
    IReadOnlyCollection<CredentialFileDto> Files,
    bool CanViewSecret,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc
);

public record CredentialFileDto(
    Guid Id,
    Guid CredentialId,
    string FileName,
    string ContentType,
    long Size,
    DateTime UploadedAtUtc
);

public class CreateCredentialDto
{
    [Required]
    public Guid CategoryId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? HostOrUrl { get; set; }

    [MaxLength(150)]
    public string? Username { get; set; }

    [MaxLength(4000)]
    public string? Password { get; set; }

    [MaxLength]
    public string? ConnectionString { get; set; }

    [MaxLength]
    public string? Notes { get; set; }

    [MaxLength(200)]
    public string? AppName { get; set; }

    [MaxLength(300)]
    public string? AppLink { get; set; }

    [MaxLength(100)]
    public string? AccountFirstName { get; set; }

    [MaxLength(100)]
    public string? AccountLastName { get; set; }

    [EmailAddress]
    [MaxLength(200)]
    public string? AccountEmail { get; set; }

    [MaxLength(100)]
    public string? AccountRole { get; set; }

    public bool? ServerVpnRequired { get; set; }
}

public class UpdateCredentialDto : CreateCredentialDto
{
}
