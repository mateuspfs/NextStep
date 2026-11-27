using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NextStep.Application.Interfaces.Services;

namespace NextStep.Infrastructure.Services;

public class GeminiAiService : IGeminiAiService
{
    private const string InteractionsEndpoint = "https://generativelanguage.googleapis.com/v1/interactions";
    private const string DefaultModel = "gemini-4-hydrogen";

    private readonly HttpClient _httpClient;
    private readonly ILogger<GeminiAiService> _logger;
    private readonly string _apiKey;
    private readonly string _model;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public GeminiAiService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GeminiAiService> logger)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(45);
        _logger = logger;

        _apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                  ?? configuration["Gemini:ApiKey"]
                  ?? string.Empty;

        var configuredModel = Environment.GetEnvironmentVariable("GEMINI_MODEL")
                              ?? configuration["Gemini:Model"];

        _model = string.IsNullOrWhiteSpace(configuredModel) ? DefaultModel : configuredModel.Trim();
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async Task<List<GeneratedQuizQuestionDto>?> GenerateQuizQuestionsAsync(
        string topicTitle,
        string sourceContent,
        string category,
        string modality,
        int level,
        int questionCount = 4)
    {
        if (!IsConfigured)
        {
            _logger.LogInformation("GEMINI_API_KEY não configurada. Usando gerador local de fallback.");
            return null;
        }

        var levelLabel = level == 0 ? "Iniciante" : level == 1 ? "Intermediário" : "Avançado";
        var isTrueFalse = modality.Contains("Verdadeiro", StringComparison.OrdinalIgnoreCase);
        var isOpen = modality.Contains("Aberta", StringComparison.OrdinalIgnoreCase) ||
                     modality.Contains("Dissertativa", StringComparison.OrdinalIgnoreCase);

        var modalityRules = isTrueFalse
            ? "Cada questão deve apresentar uma afirmação objetiva e exatamente 2 opções: 'Verdadeiro' e 'Falso', com exatamente 1 marcada como isCorrect = true."
            : isOpen
            ? "Cada questão deve ser discursiva/aberta e conter exatamente 1 opção em 'options' com isCorrect = true representando o gabarito esperado de referência."
            : "Cada questão deve ter exatamente 4 alternativas plausíveis, sendo exatamente 1 com isCorrect = true e 3 incorretas (isCorrect = false).";

        var cleanContext = string.IsNullOrWhiteSpace(sourceContent)
            ? $"Tema corporativo: {topicTitle} (Categoria: {category})."
            : sourceContent.Length > 4000 ? sourceContent[..4000] : sourceContent;

        var systemInstruction =
            "Você é um especialista corporativo em treinamento e gestão do conhecimento da plataforma NextStep. " +
            "Gere questões didáticas, claras, em Português do Brasil (PT-BR), baseadas fielmente no conteúdo fornecido. " +
            "Retorne exclusivamente um objeto JSON válido seguindo o schema solicitado.";

        var userPrompt =
            $"Crie exatamente {questionCount} questões de treinamento corporativo sobre o tema \"{topicTitle}\" " +
            $"(Categoria: {category}, Nível Técnico: {levelLabel}, Modalidade: {modality}).\n\n" +
            $"Regras da modalidade: {modalityRules}\n\n" +
            $"Conteúdo de referência da Base de Conhecimento:\n{cleanContext}";

        var payload = new
        {
            model = _model,
            system_instruction = systemInstruction,
            input = userPrompt,
            store = false,
            response_format = new
            {
                type = "text",
                mime_type = "application/json",
                schema = new
                {
                    type = "object",
                    properties = new
                    {
                        questions = new
                        {
                            type = "array",
                            items = new
                            {
                                type = "object",
                                properties = new
                                {
                                    questionText = new { type = "string" },
                                    options = new
                                    {
                                        type = "array",
                                        items = new
                                        {
                                            type = "object",
                                            properties = new
                                            {
                                                optionText = new { type = "string" },
                                                isCorrect = new { type = "boolean" }
                                            },
                                            required = new[] { "optionText", "isCorrect" }
                                        }
                                    }
                                },
                                required = new[] { "questionText", "options" }
                            }
                        }
                    },
                    required = new[] { "questions" }
                }
            }
        };

        var outputText = await CallInteractionsApiAsync(payload);
        if (string.IsNullOrWhiteSpace(outputText))
            return null;

        try
        {
            var cleanedJson = StripMarkdownCodeFences(outputText);
            var parsed = JsonSerializer.Deserialize<QuizGenerationEnvelope>(cleanedJson, JsonOptions);
            if (parsed?.Questions == null || parsed.Questions.Count == 0)
                return null;

            var validQuestions = parsed.Questions
                .Where(q => !string.IsNullOrWhiteSpace(q.QuestionText) && q.Options != null && q.Options.Count > 0)
                .ToList();

            foreach (var q in validQuestions)
            {
                if (!q.Options.Any(o => o.IsCorrect))
                {
                    q.Options[0].IsCorrect = true;
                }
            }

            return validQuestions.Count > 0 ? validQuestions : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao desserializar JSON de questões retornado pelo Gemini.");
            return null;
        }
    }

    public async Task<string?> GenerateLearningInsightAsync(
        string userName,
        string activityTitle,
        string score,
        List<InsightQuestionAnswerDto> qaList)
    {
        if (!IsConfigured)
            return null;

        var sb = new StringBuilder();
        sb.AppendLine($"Colaborador: {userName}");
        sb.AppendLine($"Atividade/Quiz: {activityTitle}");
        sb.AppendLine($"Desempenho: {score}");
        sb.AppendLine("Respostas registradas:");
        for (int i = 0; i < qaList.Count; i++)
        {
            var qa = qaList[i];
            sb.AppendLine($"{i + 1}. Pergunta: {qa.Question}");
            sb.AppendLine($"   Resposta do colaborador: {qa.UserAnswer} ({(qa.IsCorrect ? "Correta" : "Incorreta")})");
            if (!qa.IsCorrect && !string.IsNullOrWhiteSpace(qa.CorrectAnswer))
            {
                sb.AppendLine($"   Gabarito esperado: {qa.CorrectAnswer}");
            }
        }

        var payload = new
        {
            model = _model,
            system_instruction =
                "Você é um tutor corporativo e especialista em análise pedagógica da plataforma NextStep. " +
                "Escreva um diagnóstico objetivo em Português do Brasil (3 a 5 frases, sem markdown pesado) destacando os pontos fortes do colaborador, " +
                "as lacunas técnicas encontradas nas questões incorretas e uma recomendação prática de reforço.",
            input = sb.ToString(),
            store = false
        };

        var outputText = await CallInteractionsApiAsync(payload);
        return string.IsNullOrWhiteSpace(outputText) ? null : outputText.Trim();
    }

    private async Task<string?> CallInteractionsApiAsync(object payload)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, InteractionsEndpoint);
            request.Headers.Add("x-goog-api-key", _apiKey);
            request.Content = new StringContent(
                JsonSerializer.Serialize(payload, JsonOptions),
                Encoding.UTF8,
                "application/json");

            using var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Gemini Interactions API retornou status {StatusCode}: {Body}",
                    (int)response.StatusCode,
                    body.Length > 500 ? body[..500] : body);
                return null;
            }

            return ExtractOutputText(body);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao chamar Gemini Interactions API ({Model}).", _model);
            return null;
        }
    }

    private static string? ExtractOutputText(string jsonBody)
    {
        using var doc = JsonDocument.Parse(jsonBody);
        var root = doc.RootElement;

        // v1 Interactions API: steps[] -> trailing model_output -> content[] with type == "text"
        if (root.TryGetProperty("steps", out var steps) && steps.ValueKind == JsonValueKind.Array)
        {
            var texts = new List<string>();
            foreach (var step in steps.EnumerateArray())
            {
                var stepType = step.TryGetProperty("type", out var tProp) ? tProp.GetString() : null;
                if (!string.Equals(stepType, "model_output", StringComparison.OrdinalIgnoreCase))
                    continue;

                if (step.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.Array)
                {
                    foreach (var part in content.EnumerateArray())
                    {
                        var partType = part.TryGetProperty("type", out var pt) ? pt.GetString() : null;
                        if (string.Equals(partType, "text", StringComparison.OrdinalIgnoreCase) &&
                            part.TryGetProperty("text", out var textVal))
                        {
                            var str = textVal.GetString();
                            if (!string.IsNullOrWhiteSpace(str))
                                texts.Add(str);
                        }
                    }
                }
            }

            if (texts.Count > 0)
                return string.Join("\n", texts);
        }

        // Fallback caso a resposta venha no formato outputs[]
        if (root.TryGetProperty("outputs", out var outputs) && outputs.ValueKind == JsonValueKind.Array)
        {
            var texts = new List<string>();
            foreach (var item in outputs.EnumerateArray())
            {
                if (item.TryGetProperty("text", out var textVal))
                {
                    var str = textVal.GetString();
                    if (!string.IsNullOrWhiteSpace(str))
                        texts.Add(str);
                }
            }

            if (texts.Count > 0)
                return string.Join("\n", texts);
        }

        return null;
    }

    private static string StripMarkdownCodeFences(string text)
    {
        var trimmed = text.Trim();
        if (trimmed.StartsWith("```"))
        {
            var firstNewLine = trimmed.IndexOf('\n');
            if (firstNewLine > 0)
            {
                trimmed = trimmed[(firstNewLine + 1)..];
            }
            if (trimmed.EndsWith("```"))
            {
                trimmed = trimmed[..^3];
            }
        }
        return trimmed.Trim();
    }

    private sealed class QuizGenerationEnvelope
    {
        public List<GeneratedQuizQuestionDto> Questions { get; set; } = new();
    }
}
