using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NextStep.Application.DTOs.Courses;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;

namespace NextStep.Infrastructure.Services;

public class CourseService : ICourseService
{
    private readonly ICourseRepository _courseRepository;
    private readonly IUserCourseRepository _userCourseRepository;
    private readonly IUserStatsService _userStatsService;
    private readonly IBadgeService _badgeService;
    private readonly ILogger<CourseService> _logger;

    public CourseService(
        ICourseRepository courseRepository,
        IUserCourseRepository userCourseRepository,
        IUserStatsService userStatsService,
        IBadgeService badgeService,
        ILogger<CourseService> logger)
    {
        _courseRepository = courseRepository;
        _userCourseRepository = userCourseRepository;
        _userStatsService = userStatsService;
        _badgeService = badgeService;
        _logger = logger;
    }

    public async Task<IEnumerable<CourseDto>> GetAllAsync()
    {
        var courses = await _courseRepository.GetAllAsync();
        return courses.Select(MapToDto);
    }

    public async Task<CourseDto?> GetByIdAsync(Guid id)
    {
        var course = await _courseRepository.GetWithLessonsAsync(id);
        return course == null ? null : MapToDto(course);
    }

    public async Task<CourseDto> CreateAsync(CreateCourseRequest request, Guid authorId)
    {
        var course = new Course
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            ThumbnailUrl = request.ThumbnailUrl,
            TotalLessons = request.TotalLessons,
            TotalXp = request.TotalXp,
            Level = request.Level,
            CategoryId = request.CategoryId,
            AuthorId = authorId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _courseRepository.AddAsync(course);
        return MapToDto(course);
    }

    public async Task<bool> EnrollUserAsync(Guid userId, Guid courseId)
    {
        var existing = await _userCourseRepository.GetByUserAndCourseAsync(userId, courseId);
        if (existing != null) return false;

        var course = await _courseRepository.GetByIdAsync(courseId);
        if (course == null) return false;

        var userCourse = new UserCourse
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CourseId = courseId,
            CompletedLessons = 0,
            TotalLessons = course.TotalLessons,
            ProgressPercentage = 0,
            IsCompleted = false,
            XpEarned = 0,
            StartedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userCourseRepository.AddAsync(userCourse);
        return true;
    }

    public async Task<UserCourseDto?> GetUserCourseAsync(Guid userId, Guid courseId)
    {
        var userCourse = await _userCourseRepository.GetByUserAndCourseAsync(userId, courseId);
        return userCourse == null ? null : MapToUserCourseDto(userCourse);
    }

    public async Task<IEnumerable<UserCourseDto>> GetUserCoursesAsync(Guid userId)
    {
        var userCourses = await _userCourseRepository.GetByUserAsync(userId);
        return userCourses.Select(MapToUserCourseDto);
    }

    public async Task<bool> CompleteLessonAsync(Guid userId, Guid courseId, Guid lessonId)
    {
        var userCourse = await _userCourseRepository.GetByUserAndCourseAsync(userId, courseId);
        if (userCourse == null) return false;

        userCourse.CompletedLessons++;
        userCourse.ProgressPercentage = (int)((double)userCourse.CompletedLessons / userCourse.TotalLessons * 100);
        userCourse.UpdatedAt = DateTime.UtcNow;

        if (userCourse.CompletedLessons >= userCourse.TotalLessons)
        {
            userCourse.IsCompleted = true;
            userCourse.CompletedAt = DateTime.UtcNow;
            userCourse.XpEarned = userCourse.Course?.TotalXp ?? 0;

            await _userStatsService.AddXpAsync(userId, userCourse.XpEarned);
            await _userStatsService.IncrementCoursesCompletedAsync(userId);
            await _badgeService.CheckAndAwardBadgesAsync(userId);
        }

        await _userCourseRepository.UpdateAsync(userCourse);
        return true;
    }

    public async Task<bool> UpdateProgressAsync(Guid userId, Guid courseId)
    {
        var userCourse = await _userCourseRepository.GetByUserAndCourseAsync(userId, courseId);
        if (userCourse == null) return false;

        userCourse.ProgressPercentage = (int)((double)userCourse.CompletedLessons / userCourse.TotalLessons * 100);
        userCourse.UpdatedAt = DateTime.UtcNow;

        await _userCourseRepository.UpdateAsync(userCourse);
        return true;
    }

    private CourseDto MapToDto(Course course)
    {
        return new CourseDto
        {
            Id = course.Id,
            Title = course.Title,
            Description = course.Description,
            ThumbnailUrl = course.ThumbnailUrl,
            TotalLessons = course.TotalLessons,
            TotalXp = course.TotalXp,
            Level = course.Level,
            CategoryId = course.CategoryId,
            CategoryName = course.Category?.Name ?? string.Empty,
            AuthorId = course.AuthorId,
            AuthorName = course.Author?.FullName ?? string.Empty,
            IsActive = course.IsActive,
            CreatedAt = course.CreatedAt,
            UpdatedAt = course.UpdatedAt
        };
    }

    private UserCourseDto MapToUserCourseDto(UserCourse userCourse)
    {
        return new UserCourseDto
        {
            Id = userCourse.Id,
            UserId = userCourse.UserId,
            CourseId = userCourse.CourseId,
            CourseTitle = userCourse.Course?.Title ?? string.Empty,
            CourseThumbnail = userCourse.Course?.ThumbnailUrl,
            CompletedLessons = userCourse.CompletedLessons,
            TotalLessons = userCourse.TotalLessons,
            ProgressPercentage = userCourse.ProgressPercentage,
            IsCompleted = userCourse.IsCompleted,
            XpEarned = userCourse.XpEarned,
            CompletedAt = userCourse.CompletedAt,
            StartedAt = userCourse.StartedAt,
            UpdatedAt = userCourse.UpdatedAt
        };
    }
}
