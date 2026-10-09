using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.Infrastructure.Repositories;

public class UserCourseRepository : Repository<UserCourse>, IUserCourseRepository
{
    public UserCourseRepository(NextStepDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<UserCourse>> GetByUserAsync(Guid userId)
    {
        return await _dbSet
            .Where(uc => uc.UserId == userId)
            .Include(uc => uc.Course)
            .ToListAsync();
    }

    public async Task<UserCourse?> GetByUserAndCourseAsync(Guid userId, Guid courseId)
    {
        return await _dbSet
            .Include(uc => uc.Course)
            .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.CourseId == courseId);
    }

    public async Task<IEnumerable<UserCourse>> GetCompletedByUserAsync(Guid userId)
    {
        return await _dbSet
            .Where(uc => uc.UserId == userId && uc.IsCompleted)
            .Include(uc => uc.Course)
            .ToListAsync();
    }

    public async Task<int> GetTotalCompletedCoursesAsync(Guid userId)
    {
        return await _dbSet.CountAsync(uc => uc.UserId == userId && uc.IsCompleted);
    }
}
