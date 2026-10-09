namespace NextStep.Application.DTOs.Stats;

public class UserStatsDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public int XpToNextLevel { get; set; }
    public int CoursesCompleted { get; set; }
    public int ActivitiesCompleted { get; set; }
    public int BadgesEarned { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateTime? LastActivityDate { get; set; }
}
