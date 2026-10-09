using System;

namespace NextStep.Domain.Entities;

public class QuizQuestion
{
    public Guid Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public Guid QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<QuizOption> Options { get; set; } = new List<QuizOption>();
}
