using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.Infrastructure.Repositories;

public class BadgeRepository : Repository<Badge>, IBadgeRepository
{
    public BadgeRepository(NextStepDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Badge>> GetActiveAsync()
    {
        return await _dbSet.Where(b => b.IsActive).ToListAsync();
    }

    public async Task<IEnumerable<Badge>> GetByRarityAsync(BadgeRarity rarity)
    {
        return await _dbSet.Where(b => b.Rarity == rarity && b.IsActive).ToListAsync();
    }
}
