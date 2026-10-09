using System;
using System.Threading.Tasks;
using NextStep.Application.DTOs.Stats;

namespace NextStep.Application.Interfaces.Services;

public interface IUserStatsService
{
    Task<UserStatsDto?> GetByUserIdAsync(Guid userId);
    Task<UserStatsDto> AddXpAsync(Guid userId, int xp);
    Task<UserStatsDto> IncrementCoursesCompletedAsync(Guid userId);
    Task<UserStatsDto> IncrementActivitiesCompletedAsync(Guid userId);
    Task<UserStatsDto> UpdateStreakAsync(Guid userId);
}
