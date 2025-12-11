using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoraxCredentials.Api.Models;

public class CredentialItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid CategoryId { get; set; }

    [ForeignKey(nameof(CategoryId))]
    public Category? Category { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? HostOrUrl { get; set; }

    [MaxLength(150)]
    public string? Username { get; set; }

    // Sensitive data stored encrypted
    [MaxLength]
    public string? EncryptedPassword { get; set; }

    [MaxLength]
    public string? EncryptedConnectionString { get; set; }

    [MaxLength]
    public string? EncryptedNotes { get; set; }

    // İç Uygulamalar için özel alanlar
    [MaxLength(200)]
    public string? AppName { get; set; }

    [MaxLength(300)]
    public string? AppLink { get; set; }

    [MaxLength(100)]
    public string? AccountFirstName { get; set; }

    [MaxLength(100)]
    public string? AccountLastName { get; set; }

    [MaxLength(200)]
    public string? AccountEmail { get; set; }

    [MaxLength(100)]
    public string? AccountRole { get; set; }

    // Sunucular için özel alanlar
    public bool? ServerVpnRequired { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<UserCredentialAccess> CredentialAccesses { get; set; } = new List<UserCredentialAccess>();
    public ICollection<CredentialFile> Files { get; set; } = new List<CredentialFile>();
}
