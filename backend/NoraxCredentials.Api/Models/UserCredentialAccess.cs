namespace NoraxCredentials.Api.Models;

public class UserCredentialAccess
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public Guid CredentialId { get; set; }
    public CredentialItem? Credential { get; set; }

    public DateTime GrantedAtUtc { get; set; } = DateTime.UtcNow;
}
