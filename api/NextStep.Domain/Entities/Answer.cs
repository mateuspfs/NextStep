using System;

namespace NextStep.Domain.Entities;

public class Answer
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public Guid QuestionId { get; set; }
    public Question Question { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
