using System;

namespace NextStep.Domain.Entities;

public class QuizOption
{
    public Guid Id { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public Guid QuizQuestionId { get; set; }
    public QuizQuestion QuizQuestion { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
