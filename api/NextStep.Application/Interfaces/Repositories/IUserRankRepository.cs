using System;
using System.Threading.Tasks;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Repositories;

public interface IUserRankRepository : IRepository<UserRank>
{
    Task<UserRank?> GetByUserAsync(Guid userId);
    Task<UserRank?> GetByUserWithRankAsync(Guid userId);
}
