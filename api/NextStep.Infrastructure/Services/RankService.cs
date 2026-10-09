using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NextStep.Application.DTOs.Leaderboard;
using NextStep.Application.DTOs.Ranks;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;

namespace NextStep.Infrastructure.Services;

public class RankService : IRankService
{
    private readonly IRankRepository _rankRepository;
    private readonly IUserRankRepository _userRankRepository;
    private readonly IUserStatsRepository _userStatsRepository;
    private readonly ILogger<RankService> _logger;

    public RankService(
        IRankRepository rankRepository,
        IUserRankRepository userRankRepository,
        IUserStatsRepository userStatsRepository,
        ILogger<RankService> logger)
    {
        _rankRepository = rankRepository;
        _userRankRepository = userRankRepository;
        _userStatsRepository = userStatsRepository;
        _logger = logger;
    }

    public async Task<IEnumerable<RankDto>> GetAllAsync()
    {
        var ranks = await _rankRepository.GetOrderedAsync();
        return ranks.Select(MapToDto);
    }

    public async Task<UserRankDto?> GetUserRankAsync(Guid userId)
    {
        var userRank = await _userRankRepository.GetByUserWithRankAsync(userId);
        if (userRank == null) return null;

        return new UserRankDto
        {
            Id = userRank.Id,
            UserId = userRank.UserId,
            RankId = userRank.RankId,
            RankName = userRank.Rank?.Name ?? string.Empty,
            RankDescription = userRank.Rank?.Description ?? string.Empty,
            RankIconUrl = userRank.Rank?.IconUrl ?? string.Empty,
            RankColor = userRank.Rank?.Color ?? string.Empty,
            CurrentPoints = userRank.CurrentPoints,
            AchievedAt = userRank.AchievedAt
        };
    }

    public async Task<bool> UpdateUserRankAsync(Guid userId)
    {
        var stats = await _userStatsRepository.GetOrCreateByUserAsync(userId);
        var rank = await _rankRepository.GetByPointsAsync(stats.TotalXp);
        if (rank == null) return false;

        var userRank = await _userRankRepository.GetByUserAsync(userId);
        if (userRank == null)
        {
            userRank = new UserRank
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                RankId = rank.Id,
                CurrentPoints = stats.TotalXp,
                AchievedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _userRankRepository.AddAsync(userRank);
        }
        else
        {
            userRank.RankId = rank.Id;
            userRank.CurrentPoints = stats.TotalXp;
            userRank.UpdatedAt = DateTime.UtcNow;
            await _userRankRepository.UpdateAsync(userRank);
        }

        return true;
    }

    public async Task<IEnumerable<LeaderboardEntryDto>> GetLeaderboardAsync(int top = 20)
    {
        var allStats = await _userStatsRepository.GetAllAsync();
        var orderedStats = allStats
            .OrderByDescending(s => s.TotalXp)
            .Take(top)
            .ToList();

        var leaderboard = new List<LeaderboardEntryDto>();
        for (int i = 0; i < orderedStats.Count; i++)
        {
            var stat = orderedStats[i];
            var userRank = await _userRankRepository.GetByUserAsync(stat.UserId);
            var user = await _userRankRepository.GetByIdAsync(stat.UserId);

            leaderboard.Add(new LeaderboardEntryDto
            {
                UserId = stat.UserId,
                UserName = user?.User?.FullName ?? "Unknown",
                UserPhotoUrl = user?.User?.PhotoUrl,
                TotalXp = stat.TotalXp,
                CurrentLevel = stat.CurrentLevel,
                Position = i + 1,
                RankName = userRank?.Rank?.Name ?? "Unranked",
                RankIconUrl = userRank?.Rank?.IconUrl ?? string.Empty
            });
        }

        return leaderboard;
    }

    private RankDto MapToDto(Rank rank)
    {
        return new RankDto
        {
            Id = rank.Id,
            Name = rank.Name,
            Description = rank.Description,
            MinPoints = rank.MinPoints,
            MaxPoints = rank.MaxPoints,
            IconUrl = rank.IconUrl,
            Color = rank.Color,
            Position = rank.Position
        };
    }
}
