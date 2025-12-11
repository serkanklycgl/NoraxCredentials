namespace NoraxCredentials.Api.Models;

public class CredentialFile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CredentialId { get; set; }
    public CredentialItem? Credential { get; set; }

    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long Size { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
}
