using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Repositories;

public interface IBadgeRepository : IRepository<Badge>
{
    Task<IEnumerable<Badge>> GetActiveAsync();
    Task<IEnumerable<Badge>> GetByRarityAsync(BadgeRarity rarity);
}
