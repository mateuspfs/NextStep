using System.Threading.Tasks;
using NextStep.Application.DTOs.Auth;

namespace NextStep.Application.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
}
