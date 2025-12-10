using System.Security.Cryptography;
using System.Text;

namespace NoraxCredentials.Api.Services;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 120000;
    private const char Delimiter = '.';

    public string HashPassword(string password)
    {
        using var rng = RandomNumberGenerator.Create();
        var salt = new byte[SaltSize];
        rng.GetBytes(salt);

        var key = PBKDF2(password, salt, Iterations, KeySize);
        return $"{Iterations}{Delimiter}{Convert.ToBase64String(salt)}{Delimiter}{Convert.ToBase64String(key)}";
    }

    public bool VerifyPassword(string password, string hashed)
    {
        if (string.IsNullOrWhiteSpace(hashed)) return false;
        var parts = hashed.Split(Delimiter);
        if (parts.Length != 3) return false;

        if (!int.TryParse(parts[0], out var iterations)) return false;
        var salt = Convert.FromBase64String(parts[1]);
        var key = Convert.FromBase64String(parts[2]);

        var attemptedKey = PBKDF2(password, salt, iterations, key.Length);
        return CryptographicOperations.FixedTimeEquals(attemptedKey, key);
    }

    private static byte[] PBKDF2(string password, byte[] salt, int iterations, int outputBytes)
    {
        using var pbkdf2 = new Rfc2898DeriveBytes(Encoding.UTF8.GetBytes(password), salt, iterations, HashAlgorithmName.SHA256);
        return pbkdf2.GetBytes(outputBytes);
    }
}
