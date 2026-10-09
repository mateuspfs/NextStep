using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Repositories;

public interface IUserCourseRepository : IRepository<UserCourse>
{
    Task<IEnumerable<UserCourse>> GetByUserAsync(Guid userId);
    Task<UserCourse?> GetByUserAndCourseAsync(Guid userId, Guid courseId);
    Task<IEnumerable<UserCourse>> GetCompletedByUserAsync(Guid userId);
    Task<int> GetTotalCompletedCoursesAsync(Guid userId);
}
