using System;
using System.Collections.Generic;

namespace NextStep.Domain.Entities;

public class Content
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ContentType Type { get; set; }
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public ContentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
}

public enum ContentType
{
    CaseStudy = 0,
    Article = 1,
    CommonError = 2
}

public enum ContentStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}
