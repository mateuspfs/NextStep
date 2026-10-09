using System;

namespace NextStep.Domain.Entities;

public class UserStats
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public int XpToNextLevel { get; set; }
    public int CoursesCompleted { get; set; }
    public int ActivitiesCompleted { get; set; }
    public int BadgesEarned { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateTime? LastActivityDate { get; set; }
    public DateTime UpdatedAt { get; set; }
}
