namespace NextStep.Application.DTOs.Courses;

public class UserCourseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string? CourseThumbnail { get; set; }
    public int CompletedLessons { get; set; }
    public int TotalLessons { get; set; }
    public int ProgressPercentage { get; set; }
    public bool IsCompleted { get; set; }
    public int XpEarned { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
