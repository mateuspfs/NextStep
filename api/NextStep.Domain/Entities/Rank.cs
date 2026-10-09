using System;
using System.Collections.Generic;

namespace NextStep.Domain.Entities;

public class Rank
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MinPoints { get; set; }
    public int MaxPoints { get; set; }
    public string IconUrl { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Position { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<UserRank> UserRanks { get; set; } = new List<UserRank>();
}
