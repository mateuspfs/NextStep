using System.Threading.Tasks;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Repositories;

public interface ICategoryRepository : IRepository<Category>
{
    Task<Category?> GetByNameAsync(string name);
}
