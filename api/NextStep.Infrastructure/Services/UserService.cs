using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NextStep.Application.DTOs.Auth;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;

namespace NextStep.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IUserStatsRepository _userStatsRepository;
    private readonly IRankService _rankService;
    private readonly IPasswordService _passwordService;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IUserRepository userRepository,
        IUserStatsRepository userStatsRepository,
        IRankService rankService,
        IPasswordService passwordService,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _userStatsRepository = userStatsRepository;
        _rankService = rankService;
        _passwordService = passwordService;
        _logger = logger;
    }

    public async Task<UserDto> CreateUserAsync(CreateUserRequest request)
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
            PhotoUrl = "MUST_CHANGE_PWD",
            Role = (Domain.Entities.UserRole)request.Role,
            NexPoints = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);

        try
        {
            await _userStatsRepository.GetOrCreateByUserAsync(user.Id);
            await _rankService.UpdateUserRankAsync(user.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Aviso ao inicializar stats/rank do usuário criado {Email}", user.Email);
        }

        return MapUserDto(user);
    }

    public async Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return null;

        if (!string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (await _userRepository.EmailExistsAsync(request.Email))
            {
                throw new InvalidOperationException("E-mail já está em uso por outro usuário.");
            }
            user.Email = request.Email.Trim();
        }

        user.FullName = request.FullName.Trim();
        if (request.PhotoUrl != null)
        {
            user.PhotoUrl = string.IsNullOrWhiteSpace(request.PhotoUrl) ? null : request.PhotoUrl.Trim();
        }
        if (request.Role.HasValue)
        {
            user.Role = request.Role.Value;
        }
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            if (_passwordService.VerifyPassword(request.Password, user.PasswordHash))
            {
                throw new InvalidOperationException("A nova senha não pode ser igual à senha temporária ou atual.");
            }
            user.PasswordHash = _passwordService.HashPassword(request.Password);
            if (request.Role.HasValue)
            {
                // Admin resetting password -> force user to change on next login
                user.PhotoUrl = "MUST_CHANGE_PWD";
            }
            else if (user.PhotoUrl == "MUST_CHANGE_PWD")
            {
                // User changing their own password -> clear pending flag
                user.PhotoUrl = null;
            }
        }
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);

        return MapUserDto(user);
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(MapUserDto);
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return null;

        return MapUserDto(user);
    }

    private static UserDto MapUserDto(User u)
    {
        var mustChange = u.PhotoUrl == "MUST_CHANGE_PWD";
        return new UserDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            PhotoUrl = mustChange ? null : u.PhotoUrl,
            Role = (Domain.Entities.UserRole)u.Role,
            NexPoints = u.NexPoints,
            MustChangePassword = mustChange,
            CreatedAt = u.CreatedAt
        };
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        await _userRepository.DeleteAsync(user);
        return true;
    }
}
