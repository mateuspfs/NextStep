using System;
using System.Collections.Generic;

namespace NextStep.Domain.Entities;

public class Quiz
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid ActivityId { get; set; }
    public Activity Activity { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<QuizQuestion> QuizQuestions { get; set; } = new List<QuizQuestion>();
}
