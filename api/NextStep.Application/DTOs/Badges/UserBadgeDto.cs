namespace NextStep.Application.DTOs.Badges;

public class UserBadgeDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid BadgeId { get; set; }
    public string BadgeName { get; set; } = string.Empty;
    public string BadgeDescription { get; set; } = string.Empty;
    public string BadgeIconUrl { get; set; } = string.Empty;
    public string BadgeRarity { get; set; } = string.Empty;
    public DateTime EarnedAt { get; set; }
    public bool IsDisplayed { get; set; }
}
