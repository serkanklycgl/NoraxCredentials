namespace NoraxCredentials.Api.Configurations;

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "NoraxCredentials";
    public string Audience { get; set; } = "NoraxCredentialsUsers";
    public int TokenLifetimeMinutes { get; set; } = 120;
}
