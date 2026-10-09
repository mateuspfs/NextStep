using NextStep.Domain.Entities;

namespace NextStep.Application.DTOs.Badges;

public class BadgeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public BadgeRarity Rarity { get; set; }
    public int RequiredPoints { get; set; }
    public string? Criteria { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
