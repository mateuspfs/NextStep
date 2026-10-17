using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;

namespace NextStep.Infrastructure.Services;

public class JwtService : IJwtService
{
    private const string DefaultSecretKey = "NextStepDefaultSecretKeyForDevelopmentOnly123456";
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public static string ResolveSecretKey(IConfiguration configuration)
    {
        var rawKey = configuration["JwtSettings:SecretKey"];
        if (string.IsNullOrWhiteSpace(rawKey))
        {
            return DefaultSecretKey;
        }

        var trimmed = rawKey.Trim();
        if (Encoding.UTF8.GetByteCount(trimmed) < 32)
        {
            return trimmed.PadRight(32, '_');
        }

        return trimmed;
    }

    public string GenerateToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = ResolveSecretKey(_configuration);
        var issuer = string.IsNullOrWhiteSpace(jwtSettings["Issuer"]) ? "NextStep" : jwtSettings["Issuer"]!;
        var audience = string.IsNullOrWhiteSpace(jwtSettings["Audience"]) ? "NextStep" : jwtSettings["Audience"]!;
        var expiryMinutes = int.TryParse(jwtSettings["ExpiryMinutes"], out var parsedExpiry) && parsedExpiry > 0
            ? parsedExpiry
            : 60;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = ResolveSecretKey(_configuration);
        var issuer = string.IsNullOrWhiteSpace(jwtSettings["Issuer"]) ? "NextStep" : jwtSettings["Issuer"]!;
        var audience = string.IsNullOrWhiteSpace(jwtSettings["Audience"]) ? "NextStep" : jwtSettings["Audience"]!;

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(secretKey);

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
