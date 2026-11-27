using System.Collections.Generic;
using System.Threading.Tasks;

namespace NextStep.Application.Interfaces.Services;

public class GeneratedQuizOptionDto
{
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class GeneratedQuizQuestionDto
{
    public string QuestionText { get; set; } = string.Empty;
    public List<GeneratedQuizOptionDto> Options { get; set; } = new();
}

public class InsightQuestionAnswerDto
{
    public string Question { get; set; } = string.Empty;
    public string UserAnswer { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public interface IGeminiAiService
{
    bool IsConfigured { get; }

    Task<List<GeneratedQuizQuestionDto>?> GenerateQuizQuestionsAsync(
        string topicTitle,
        string sourceContent,
        string category,
        string modality,
        int level,
        int questionCount = 4);

    Task<string?> GenerateLearningInsightAsync(
        string userName,
        string activityTitle,
        string score,
        List<InsightQuestionAnswerDto> qaList);
}
