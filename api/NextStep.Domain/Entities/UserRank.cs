using System;

namespace NextStep.Domain.Entities;

public class UserRank
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid RankId { get; set; }
    public Rank Rank { get; set; } = null!;
    public int CurrentPoints { get; set; }
    public DateTime AchievedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
