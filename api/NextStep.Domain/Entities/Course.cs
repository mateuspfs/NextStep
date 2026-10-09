using System;
using System.Collections.Generic;

namespace NextStep.Domain.Entities;

public class Course
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public int TotalLessons { get; set; }
    public int TotalXp { get; set; }
    public TechnicalLevel Level { get; set; }
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<CourseLesson> Lessons { get; set; } = new List<CourseLesson>();
    public ICollection<UserCourse> UserCourses { get; set; } = new List<UserCourse>();
}
