using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.Infrastructure.Repositories;

public class UserRankRepository : Repository<UserRank>, IUserRankRepository
{
    public UserRankRepository(NextStepDbContext context) : base(context)
    {
    }

    public async Task<UserRank?> GetByUserAsync(Guid userId)
    {
        return await _dbSet
            .Include(ur => ur.Rank)
            .FirstOrDefaultAsync(ur => ur.UserId == userId);
    }

    public async Task<UserRank?> GetByUserWithRankAsync(Guid userId)
    {
        return await _dbSet
            .Include(ur => ur.Rank)
            .FirstOrDefaultAsync(ur => ur.UserId == userId);
    }
}
