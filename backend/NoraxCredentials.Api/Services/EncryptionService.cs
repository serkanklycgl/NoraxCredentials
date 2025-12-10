using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace NoraxCredentials.Api.Services;

public class EncryptionService(IOptions<EncryptionSettings> options) : IEncryptionService
{
    private readonly byte[] _keyBytes = NormalizeKey(options.Value.Key);

    public string Encrypt(string? plainText)
    {
        if (string.IsNullOrEmpty(plainText))
        {
            return string.Empty;
        }

        using var aes = Aes.Create();
        aes.Key = _keyBytes;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        // Prepend IV to the cipher text and return as base64
        var combinedBytes = new byte[aes.IV.Length + cipherBytes.Length];
        Buffer.BlockCopy(aes.IV, 0, combinedBytes, 0, aes.IV.Length);
        Buffer.BlockCopy(cipherBytes, 0, combinedBytes, aes.IV.Length, cipherBytes.Length);

        return Convert.ToBase64String(combinedBytes);
    }

    public string Decrypt(string? cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
        {
            return string.Empty;
        }

        var combinedBytes = Convert.FromBase64String(cipherText);
        var iv = new byte[16];
        var cipherBytes = new byte[combinedBytes.Length - iv.Length];

        Buffer.BlockCopy(combinedBytes, 0, iv, 0, iv.Length);
        Buffer.BlockCopy(combinedBytes, iv.Length, cipherBytes, 0, cipherBytes.Length);

        using var aes = Aes.Create();
        aes.Key = _keyBytes;
        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
        return Encoding.UTF8.GetString(plainBytes);
    }

    private static byte[] NormalizeKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException("Encryption key is missing. Set Encryption:Key in configuration.");
        }

        // Hash the provided key to 32 bytes to fit AES-256
        return SHA256.HashData(Encoding.UTF8.GetBytes(key));
    }
}
