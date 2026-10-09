namespace NextStep.Application.DTOs.Ranks;

public class UserRankDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid RankId { get; set; }
    public string RankName { get; set; } = string.Empty;
    public string RankDescription { get; set; } = string.Empty;
    public string RankIconUrl { get; set; } = string.Empty;
    public string RankColor { get; set; } = string.Empty;
    public int CurrentPoints { get; set; }
    public DateTime AchievedAt { get; set; }
}
