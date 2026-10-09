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
    private readonly ILogger<BadgeService> _logger;

    public BadgeService(
        IBadgeRepository badgeRepository,
        IUserBadgeRepository userBadgeRepository,
        IUserStatsRepository userStatsRepository,
        ILogger<BadgeService> logger)
    {
        _badgeRepository = badgeRepository;
        _userBadgeRepository = userBadgeRepository;
        _userStatsRepository = userStatsRepository;
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

        var userBadge = new UserBadge
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BadgeId = badgeId,
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
        var stats = await _userStatsRepository.GetOrCreateByUserAsync(userId);
        var allBadges = await _badgeRepository.GetActiveAsync();
        bool anyAwarded = false;

        foreach (var badge in allBadges)
        {
            if (stats.TotalXp >= badge.RequiredPoints && !await _userBadgeRepository.HasBadgeAsync(userId, badge.Id))
            {
                await AwardBadgeAsync(userId, badge.Id);
                anyAwarded = true;
            }
        }

        return anyAwarded;
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
