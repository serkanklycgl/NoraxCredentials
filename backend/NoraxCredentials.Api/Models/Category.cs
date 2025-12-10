using System.ComponentModel.DataAnnotations;

namespace NoraxCredentials.Api.Models;

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public ICollection<CredentialItem> Credentials { get; set; } = new List<CredentialItem>();
}
