using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Application.DTOs.Courses;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Services;

public interface ICourseService
{
    Task<IEnumerable<CourseDto>> GetAllAsync();
    Task<CourseDto?> GetByIdAsync(Guid id);
    Task<CourseDto> CreateAsync(CreateCourseRequest request, Guid authorId);
    Task<bool> EnrollUserAsync(Guid userId, Guid courseId);
    Task<UserCourseDto?> GetUserCourseAsync(Guid userId, Guid courseId);
    Task<IEnumerable<UserCourseDto>> GetUserCoursesAsync(Guid userId);
    Task<bool> CompleteLessonAsync(Guid userId, Guid courseId, Guid lessonId);
    Task<bool> UpdateProgressAsync(Guid userId, Guid courseId);
}
