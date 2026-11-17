using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NextStep.Application.DTOs.Badges;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;

namespace NextStep.Infrastructure.Services;

public class BadgeService : IBadgeService
{
    private readonly IBadgeRepository _badgeRepository;
    private readonly IUserBadgeRepository _userBadgeRepository;
    private readonly IUserStatsRepository _userStatsRepository;
    private readonly IContentRepository _contentRepository;
    private readonly ILogger<BadgeService> _logger;

    public BadgeService(
        IBadgeRepository badgeRepository,
        IUserBadgeRepository userBadgeRepository,
        IUserStatsRepository userStatsRepository,
        IContentRepository contentRepository,
        ILogger<BadgeService> logger)
    {
        _badgeRepository = badgeRepository;
        _userBadgeRepository = userBadgeRepository;
        _userStatsRepository = userStatsRepository;
        _contentRepository = contentRepository;
        _logger = logger;
    }

    public async Task<IEnumerable<BadgeDto>> GetAllAsync()
    {
        var badges = await _badgeRepository.GetAllAsync();
        return badges.Select(MapToDto);
    }

    public async Task<IEnumerable<UserBadgeDto>> GetUserBadgesAsync(Guid userId)
    {
        var userBadges = await _userBadgeRepository.GetByUserAsync(userId);
        return userBadges.Select(MapToUserBadgeDto);
    }

    public async Task<bool> AwardBadgeAsync(Guid userId, Guid badgeId)
    {
        if (await _userBadgeRepository.HasBadgeAsync(userId, badgeId))
            return false;

        var badge = await _badgeRepository.GetByIdAsync(badgeId);
        if (badge == null)
            return false;

        var userBadge = new UserBadge
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BadgeId = badgeId,
            Badge = badge,
            EarnedAt = DateTime.UtcNow,
            IsDisplayed = true
        };

        await _userBadgeRepository.AddAsync(userBadge);

        var stats = await _userStatsRepository.GetOrCreateByUserAsync(userId);
        stats.BadgesEarned++;
        stats.UpdatedAt = DateTime.UtcNow;
        await _userStatsRepository.UpdateAsync(stats);

        return true;
    }

    public async Task<bool> CheckAndAwardBadgesAsync(Guid userId)
    {
        var newlyAwarded = await CheckAndAwardBadgesDetailedAsync(userId);
        return newlyAwarded.Count > 0;
    }

    public async Task<List<UserBadgeDto>> CheckAndAwardBadgesDetailedAsync(Guid userId)
    {
        var stats = await _userStatsRepository.GetOrCreateByUserAsync(userId);
        var allBadges = await _badgeRepository.GetActiveAsync();
        var newlyAwarded = new List<UserBadgeDto>();

        // Cache content count lazily if needed for contributor criteria
        int? authorContentCount = null;

        foreach (var badge in allBadges)
        {
            if (await _userBadgeRepository.HasBadgeAsync(userId, badge.Id))
                continue;

            bool isEligible = false;
            var criteria = badge.Criteria?.Trim().ToLowerInvariant();

            switch (criteria)
            {
                case "first_login":
                    isEligible = true;
                    break;

                case "first_course":
                    isEligible = stats.CoursesCompleted >= 1 || (badge.RequiredPoints > 0 && stats.TotalXp >= badge.RequiredPoints);
                    break;

                case "five_courses":
                    isEligible = stats.CoursesCompleted >= 5 || (badge.RequiredPoints > 0 && stats.TotalXp >= badge.RequiredPoints);
                    break;

                case "quiz_master":
                    isEligible = stats.ActivitiesCompleted >= 5 || (badge.RequiredPoints > 0 && stats.TotalXp >= badge.RequiredPoints);
                    break;

                case "streak_7":
                    isEligible = stats.CurrentStreak >= 7 || stats.LongestStreak >= 7 || (badge.RequiredPoints > 0 && stats.TotalXp >= badge.RequiredPoints);
                    break;

                case "contributor":
                    if (!authorContentCount.HasValue)
                    {
                        var contents = await _contentRepository.GetByAuthorAsync(userId);
                        authorContentCount = contents.Count();
                    }
                    isEligible = authorContentCount.Value >= 5 || (badge.RequiredPoints > 0 && stats.TotalXp >= badge.RequiredPoints);
                    break;

                case "expert":
                    isEligible = stats.TotalXp >= 5000 || (badge.RequiredPoints > 0 && stats.TotalXp >= badge.RequiredPoints);
                    break;

                case "legend":
                    isEligible = stats.TotalXp >= 10000 || (badge.RequiredPoints > 0 && stats.TotalXp >= badge.RequiredPoints);
                    break;

                default:
                    isEligible = badge.RequiredPoints > 0 && stats.TotalXp >= badge.RequiredPoints;
                    break;
            }

            if (isEligible)
            {
                var userBadge = new UserBadge
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    BadgeId = badge.Id,
                    Badge = badge,
                    EarnedAt = DateTime.UtcNow,
                    IsDisplayed = true
                };

                await _userBadgeRepository.AddAsync(userBadge);
                stats.BadgesEarned++;
                stats.UpdatedAt = DateTime.UtcNow;

                newlyAwarded.Add(MapToUserBadgeDto(userBadge));
                _logger.LogInformation("Badge {BadgeName} concedido ao usuário {UserId}", badge.Name, userId);
            }
        }

        if (newlyAwarded.Count > 0)
        {
            await _userStatsRepository.UpdateAsync(stats);
        }

        return newlyAwarded;
    }

    private BadgeDto MapToDto(Badge badge)
    {
        return new BadgeDto
        {
            Id = badge.Id,
            Name = badge.Name,
            Description = badge.Description,
            IconUrl = badge.IconUrl,
            Rarity = badge.Rarity,
            RequiredPoints = badge.RequiredPoints,
            Criteria = badge.Criteria,
            IsActive = badge.IsActive,
            CreatedAt = badge.CreatedAt
        };
    }

    private UserBadgeDto MapToUserBadgeDto(UserBadge userBadge)
    {
        return new UserBadgeDto
        {
            Id = userBadge.Id,
            UserId = userBadge.UserId,
            BadgeId = userBadge.BadgeId,
            BadgeName = userBadge.Badge?.Name ?? string.Empty,
            BadgeDescription = userBadge.Badge?.Description ?? string.Empty,
            BadgeIconUrl = userBadge.Badge?.IconUrl ?? string.Empty,
            BadgeRarity = userBadge.Badge?.Rarity.ToString() ?? string.Empty,
            EarnedAt = userBadge.EarnedAt,
            IsDisplayed = userBadge.IsDisplayed
        };
    }
}
