namespace NoraxCredentials.Api.Configurations;

public class ApiKeySettings
{
    public string HeaderName { get; set; } = "X-API-KEY";
    public string Value { get; set; } = string.Empty;
}
