using System;

namespace NextStep.Domain.Entities;

public class CourseLesson
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int Order { get; set; }
    public int DurationMinutes { get; set; }
    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<UserLessonProgress> UserProgress { get; set; } = new List<UserLessonProgress>();
}
