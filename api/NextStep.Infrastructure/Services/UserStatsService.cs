using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NextStep.Application.DTOs.Stats;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;

namespace NextStep.Infrastructure.Services;

public class UserStatsService : IUserStatsService
{
    private readonly IUserStatsRepository _userStatsRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRankService _rankService;
    private readonly IBadgeService _badgeService;
    private readonly ILogger<UserStatsService> _logger;

    public UserStatsService(
        IUserStatsRepository userStatsRepository,
        IUserRepository userRepository,
        IRankService rankService,
        IBadgeService badgeService,
        ILogger<UserStatsService> logger)
    {
        _userStatsRepository = userStatsRepository;
        _userRepository = userRepository;
        _rankService = rankService;
        _badgeService = badgeService;
        _logger = logger;
    }

    public async Task<UserStatsDto?> GetByUserIdAsync(Guid userId)
    {
        var stats = await _userStatsRepository.GetOrCreateByUserAsync(userId);
        return MapToDto(stats);
    }

    public async Task<UserStatsDto> AddXpAsync(Guid userId, int xp)
    {
        var stats = await _userStatsRepository.GetOrCreateByUserAsync(userId);
        stats.TotalXp = Math.Max(0, stats.TotalXp + xp);

        // Level up logic: every 100 XP = 1 level
        var newLevel = (stats.TotalXp / 100) + 1;
        if (newLevel > stats.CurrentLevel)
        {
            stats.CurrentLevel = newLevel;
        }
        stats.XpToNextLevel = (stats.CurrentLevel * 100) - stats.TotalXp;
        stats.UpdatedAt = DateTime.UtcNow;

        await _userStatsRepository.UpdateAsync(stats);

        var user = await _userRepository.GetByIdAsync(userId);
        if (user != null)
        {
            user.NexPoints = stats.TotalXp;
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);
        }

        try
        {
            await _rankService.UpdateUserRankAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Aviso ao atualizar rank do usuário {UserId}", userId);
        }

        try
        {
            await _badgeService.CheckAndAwardBadgesAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Aviso ao verificar emblemas para o usuário {UserId}", userId);
        }

        return MapToDto(stats);
    }

    public async Task<UserStatsDto> IncrementCoursesCompletedAsync(Guid userId)
    {
        var stats = await _userStatsRepository.GetOrCreateByUserAsync(userId);
        stats.CoursesCompleted++;
        stats.UpdatedAt = DateTime.UtcNow;

        await _userStatsRepository.UpdateAsync(stats);

        try
        {
            await _badgeService.CheckAndAwardBadgesAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Aviso ao verificar emblemas após curso concluído para o usuário {UserId}", userId);
        }

        return MapToDto(stats);
    }

    public async Task<UserStatsDto> IncrementActivitiesCompletedAsync(Guid userId)
    {
        var stats = await _userStatsRepository.GetOrCreateByUserAsync(userId);
        stats.ActivitiesCompleted++;
        stats.UpdatedAt = DateTime.UtcNow;

        await _userStatsRepository.UpdateAsync(stats);

        try
        {
            await _badgeService.CheckAndAwardBadgesAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Aviso ao verificar emblemas após atividade concluída para o usuário {UserId}", userId);
        }

        return MapToDto(stats);
    }

    public async Task<UserStatsDto> UpdateStreakAsync(Guid userId)
    {
        var stats = await _userStatsRepository.GetOrCreateByUserAsync(userId);
        var today = DateTime.UtcNow.Date;

        if (stats.LastActivityDate == null)
        {
            stats.CurrentStreak = 1;
        }
        else
        {
            var lastDate = stats.LastActivityDate.Value.Date;
            var daysDiff = (today - lastDate).Days;

            if (daysDiff == 1)
            {
                stats.CurrentStreak++;
            }
            else if (daysDiff > 1)
            {
                stats.CurrentStreak = 1;
            }
        }

        if (stats.CurrentStreak > stats.LongestStreak)
        {
            stats.LongestStreak = stats.CurrentStreak;
        }

        stats.LastActivityDate = DateTime.UtcNow;
        stats.UpdatedAt = DateTime.UtcNow;

        await _userStatsRepository.UpdateAsync(stats);

        try
        {
            await _badgeService.CheckAndAwardBadgesAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Aviso ao verificar emblemas após streak atualizado para o usuário {UserId}", userId);
        }

        return MapToDto(stats);
    }

    private UserStatsDto MapToDto(UserStats stats)
    {
        return new UserStatsDto
        {
            Id = stats.Id,
            UserId = stats.UserId,
            TotalXp = stats.TotalXp,
            CurrentLevel = stats.CurrentLevel,
            XpToNextLevel = stats.XpToNextLevel,
            CoursesCompleted = stats.CoursesCompleted,
            ActivitiesCompleted = stats.ActivitiesCompleted,
            BadgesEarned = stats.BadgesEarned,
            CurrentStreak = stats.CurrentStreak,
            LongestStreak = stats.LongestStreak,
            LastActivityDate = stats.LastActivityDate
        };
    }
}
