using System.Security.Claims;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Services;

public interface IJwtService
{
    string GenerateToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
}
