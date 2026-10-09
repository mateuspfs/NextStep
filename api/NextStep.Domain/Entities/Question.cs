using System;

namespace NextStep.Domain.Entities;

public class Question
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public Guid ActivityId { get; set; }
    public Activity Activity { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
}
