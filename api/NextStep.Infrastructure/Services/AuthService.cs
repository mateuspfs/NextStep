using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NextStep.Application.DTOs.Auth;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;

namespace NextStep.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IUserStatsRepository _userStatsRepository;
    private readonly IRankService _rankService;
    private readonly IBadgeService _badgeService;
    private readonly IJwtService _jwtService;
    private readonly IPasswordService _passwordService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        IUserStatsRepository userStatsRepository,
        IRankService rankService,
        IBadgeService badgeService,
        IJwtService jwtService,
        IPasswordService passwordService,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _userStatsRepository = userStatsRepository;
        _rankService = rankService;
        _badgeService = badgeService;
        _jwtService = jwtService;
        _passwordService = passwordService;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            throw new InvalidOperationException("Email already registered");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = _passwordService.HashPassword(request.Password),
            PhotoUrl = request.PhotoUrl,
            Role = UserRole.Common,
            NexPoints = 50,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);

        try
        {
            var stats = await _userStatsRepository.GetOrCreateByUserAsync(user.Id);
            stats.TotalXp = 50;
            stats.CurrentStreak = 1;
            stats.LongestStreak = 1;
            stats.LastActivityDate = DateTime.UtcNow;
            await _userStatsRepository.UpdateAsync(stats);
            await _rankService.UpdateUserRankAsync(user.Id);
            await _badgeService.CheckAndAwardBadgesAsync(user.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Aviso ao inicializar stats/rank do novo usuário {Email}", user.Email);
        }

        var token = _jwtService.GenerateToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        return new AuthResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhotoUrl = user.PhotoUrl,
                Role = user.Role,
                NexPoints = user.NexPoints,
                CreatedAt = user.CreatedAt
            }
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null || !_passwordService.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var token = _jwtService.GenerateToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        var mustChange = user.PhotoUrl == "MUST_CHANGE_PWD";

        return new AuthResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhotoUrl = mustChange ? null : user.PhotoUrl,
                Role = user.Role,
                NexPoints = user.NexPoints,
                MustChangePassword = mustChange,
                CreatedAt = user.CreatedAt
            }
        };
    }
}
