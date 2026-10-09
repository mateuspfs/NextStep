using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Repositories;

public interface IUserBadgeRepository : IRepository<UserBadge>
{
    Task<IEnumerable<UserBadge>> GetByUserAsync(Guid userId);
    Task<bool> HasBadgeAsync(Guid userId, Guid badgeId);
    Task<int> GetTotalBadgesAsync(Guid userId);
}
