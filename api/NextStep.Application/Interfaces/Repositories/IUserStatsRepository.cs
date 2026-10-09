using System;
using System.Threading.Tasks;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Repositories;

public interface IUserStatsRepository : IRepository<UserStats>
{
    Task<UserStats?> GetByUserAsync(Guid userId);
    Task<UserStats> GetOrCreateByUserAsync(Guid userId);
}
