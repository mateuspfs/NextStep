using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.Infrastructure.Repositories;

public class UserStatsRepository : Repository<UserStats>, IUserStatsRepository
{
    public UserStatsRepository(NextStepDbContext context) : base(context)
    {
    }

    public async Task<UserStats?> GetByUserAsync(Guid userId)
    {
        return await _dbSet.FirstOrDefaultAsync(us => us.UserId == userId);
    }

    public async Task<UserStats> GetOrCreateByUserAsync(Guid userId)
    {
        var stats = await GetByUserAsync(userId);
        if (stats == null)
        {
            stats = new UserStats
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TotalXp = 0,
                CurrentLevel = 1,
                XpToNextLevel = 100,
                CoursesCompleted = 0,
                ActivitiesCompleted = 0,
                BadgesEarned = 0,
                CurrentStreak = 0,
                LongestStreak = 0,
                UpdatedAt = DateTime.UtcNow
            };
            await _dbSet.AddAsync(stats);
            await _context.SaveChangesAsync();
        }
        return stats;
    }
}
