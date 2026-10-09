using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Repositories;

public interface ICourseRepository : IRepository<Course>
{
    Task<IEnumerable<Course>> GetByCategoryAsync(Guid categoryId);
    Task<IEnumerable<Course>> GetByLevelAsync(TechnicalLevel level);
    Task<IEnumerable<Course>> GetActiveAsync();
    Task<Course?> GetWithLessonsAsync(Guid id);
}
