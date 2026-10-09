using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.Infrastructure.Repositories;

public class RankRepository : Repository<Rank>, IRankRepository
{
    public RankRepository(NextStepDbContext context) : base(context)
    {
    }

    public async Task<Rank?> GetByPointsAsync(int points)
    {
        return await _dbSet
            .Where(r => points >= r.MinPoints && points <= r.MaxPoints)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Rank>> GetOrderedAsync()
    {
        return await _dbSet.OrderBy(r => r.Position).ToListAsync();
    }
}
