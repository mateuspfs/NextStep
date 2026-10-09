using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Application.DTOs.Leaderboard;
using NextStep.Application.DTOs.Ranks;

namespace NextStep.Application.Interfaces.Services;

public interface IRankService
{
    Task<IEnumerable<RankDto>> GetAllAsync();
    Task<UserRankDto?> GetUserRankAsync(Guid userId);
    Task<bool> UpdateUserRankAsync(Guid userId);
    Task<IEnumerable<LeaderboardEntryDto>> GetLeaderboardAsync(int top = 20);
}
