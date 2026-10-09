using System;
using System.Collections.Generic;

namespace NextStep.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public UserRole Role { get; set; }
    public int NexPoints { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Content> Contents { get; set; } = new List<Content>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public ICollection<LearningLog> LearningLogs { get; set; } = new List<LearningLog>();
}

public enum UserRole
{
    Common = 0,
    Admin = 1
}
