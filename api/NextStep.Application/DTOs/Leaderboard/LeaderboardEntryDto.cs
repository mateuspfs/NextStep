namespace NextStep.Application.DTOs.Leaderboard;

public class LeaderboardEntryDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserPhotoUrl { get; set; }
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public int Position { get; set; }
    public string RankName { get; set; } = string.Empty;
    public string RankIconUrl { get; set; } = string.Empty;
}
