using System;

namespace NextStep.Domain.Entities;

public class UserLessonProgress
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid LessonId { get; set; }
    public CourseLesson Lesson { get; set; } = null!;
    public Guid UserCourseId { get; set; }
    public UserCourse UserCourse { get; set; } = null!;
    public bool IsCompleted { get; set; }
    public int? Score { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
