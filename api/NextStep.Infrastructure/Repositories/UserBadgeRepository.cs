using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.Infrastructure.Repositories;

public class UserBadgeRepository : Repository<UserBadge>, IUserBadgeRepository
{
    public UserBadgeRepository(NextStepDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<UserBadge>> GetByUserAsync(Guid userId)
    {
        return await _dbSet
            .Where(ub => ub.UserId == userId)
            .Include(ub => ub.Badge)
            .ToListAsync();
    }

    public async Task<bool> HasBadgeAsync(Guid userId, Guid badgeId)
    {
        return await _dbSet.AnyAsync(ub => ub.UserId == userId && ub.BadgeId == badgeId);
    }

    public async Task<int> GetTotalBadgesAsync(Guid userId)
    {
        return await _dbSet.CountAsync(ub => ub.UserId == userId);
    }
}
