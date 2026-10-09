using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Repositories;

public interface IRankRepository : IRepository<Rank>
{
    Task<Rank?> GetByPointsAsync(int points);
    Task<IEnumerable<Rank>> GetOrderedAsync();
}
