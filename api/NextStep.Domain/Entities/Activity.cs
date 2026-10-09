using System;
using System.Collections.Generic;

namespace NextStep.Domain.Entities;

public class Activity
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ActivityType Type { get; set; }
    public int XpAmount { get; set; }
    public TechnicalLevel Level { get; set; }
    public Guid? ContentId { get; set; }
    public Content? Content { get; set; }
    public Guid? ProcessId { get; set; }
    public Process? Process { get; set; }
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<UserActivity> UserActivities { get; set; } = new List<UserActivity>();
}

public enum ActivityType
{
    Quiz = 0,
    OpenQuestion = 1
}

public enum TechnicalLevel
{
    Beginner = 0,
    Intermediate = 1,
    Advanced = 2
}
