using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.Infrastructure.Repositories;

public class CourseRepository : Repository<Course>, ICourseRepository
{
    public CourseRepository(NextStepDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Course>> GetByCategoryAsync(Guid categoryId)
    {
        return await _dbSet.Where(c => c.CategoryId == categoryId).ToListAsync();
    }

    public async Task<IEnumerable<Course>> GetByLevelAsync(TechnicalLevel level)
    {
        return await _dbSet.Where(c => c.Level == level).ToListAsync();
    }

    public async Task<IEnumerable<Course>> GetActiveAsync()
    {
        return await _dbSet.Where(c => c.IsActive).ToListAsync();
    }

    public async Task<Course?> GetWithLessonsAsync(Guid id)
    {
        return await _dbSet
            .Include(c => c.Lessons)
            .Include(c => c.Category)
            .Include(c => c.Author)
            .FirstOrDefaultAsync(c => c.Id == id);
    }
}
