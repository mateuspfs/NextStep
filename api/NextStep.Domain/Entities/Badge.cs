using System;
using System.Collections.Generic;

namespace NextStep.Domain.Entities;

public class Badge
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

    // Navigation properties
    public ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
}

public enum BadgeRarity
{
    Common = 0,
    Rare = 1,
    Epic = 2,
    Legendary = 3
}
