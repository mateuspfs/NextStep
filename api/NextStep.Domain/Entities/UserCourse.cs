using System;

namespace NextStep.Domain.Entities;

public class UserCourse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;
    public int CompletedLessons { get; set; }
    public int TotalLessons { get; set; }
    public int ProgressPercentage { get; set; }
    public bool IsCompleted { get; set; }
    public int XpEarned { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<UserLessonProgress> LessonProgress { get; set; } = new List<UserLessonProgress>();
}
