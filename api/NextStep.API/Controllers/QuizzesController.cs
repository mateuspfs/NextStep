using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizzesController : ControllerBase
{
    private readonly NextStepDbContext _context;
    private readonly IUserStatsService _userStatsService;

    public QuizzesController(
        NextStepDbContext context,
        IUserStatsService userStatsService)
    {
        _context = context;
        _userStatsService = userStatsService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        if (!await _context.Quizzes.AnyAsync())
        {
            await EnsureDefaultQuizzesSeededAsync();
        }

        var currentUserId = GetCurrentUserId();

        var quizzes = await _context.Quizzes
            .Include(q => q.Activity)
                .ThenInclude(a => a.Process)
                    .ThenInclude(p => p!.Category)
            .Include(q => q.Activity)
                .ThenInclude(a => a.Content)
                    .ThenInclude(c => c!.Category)
            .Include(q => q.Activity)
                .ThenInclude(a => a.Author)
            .Include(q => q.Activity)
                .ThenInclude(a => a.UserActivities)
            .Include(q => q.QuizQuestions)
                .ThenInclude(qq => qq.Options)
            .OrderBy(q => q.Title)
            .ToListAsync();

        var result = quizzes.Select(q => MapQuizDto(q, currentUserId)).ToList();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        var quiz = await _context.Quizzes
            .Include(q => q.Activity)
                .ThenInclude(a => a.Process)
                    .ThenInclude(p => p!.Category)
            .Include(q => q.Activity)
                .ThenInclude(a => a.Content)
                    .ThenInclude(c => c!.Category)
            .Include(q => q.Activity)
                .ThenInclude(a => a.Author)
            .Include(q => q.Activity)
                .ThenInclude(a => a.UserActivities)
            .Include(q => q.QuizQuestions)
                .ThenInclude(qq => qq.Options)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz == null) return NotFound();
        return Ok(MapQuizDto(quiz, currentUserId));
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateQuizRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "O título do quiz é obrigatório." });
        }

        var author = await GetOrFallbackUserAsync();
        if (author == null)
        {
            return BadRequest(new { message = "Nenhum usuário autor encontrado." });
        }

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? $"Quiz técnico sobre {request.Title.Trim()}"
                : request.Description.Trim(),
            Type = request.ActivityType == 1 ? ActivityType.OpenQuestion : ActivityType.Quiz,
            XpAmount = request.XpAmount > 0 ? request.XpAmount : 60,
            Level = (TechnicalLevel)Math.Clamp(request.Level, 0, 2),
            ProcessId = request.ProcessId,
            ContentId = request.ContentId,
            AuthorId = author.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Activities.AddAsync(activity);

        var quiz = new Quiz
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = BuildQuizMetadataDescription(
                request.Description,
                request.Category,
                request.Modality,
                request.SourceTitle
            ),
            ActivityId = activity.Id,
            Activity = activity,
            CreatedAt = DateTime.UtcNow
        };

        var questions = new List<QuizQuestion>();
        if (request.Questions != null && request.Questions.Count > 0)
        {
            foreach (var qReq in request.Questions)
            {
                if (string.IsNullOrWhiteSpace(qReq.QuestionText)) continue;
                var qq = new QuizQuestion
                {
                    Id = Guid.NewGuid(),
                    QuizId = quiz.Id,
                    QuestionText = qReq.QuestionText.Trim(),
                    CreatedAt = DateTime.UtcNow
                };

                var opts = new List<QuizOption>();
                if (qReq.Options != null && qReq.Options.Count > 0)
                {
                    foreach (var optReq in qReq.Options)
                    {
                        if (string.IsNullOrWhiteSpace(optReq.OptionText)) continue;
                        opts.Add(new QuizOption
                        {
                            Id = Guid.NewGuid(),
                            QuizQuestionId = qq.Id,
                            OptionText = optReq.OptionText.Trim(),
                            IsCorrect = optReq.IsCorrect,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                if (opts.Count > 0 && !opts.Any(o => o.IsCorrect))
                {
                    opts[0].IsCorrect = true;
                }

                qq.Options = opts;
                questions.Add(qq);
            }
        }

        quiz.QuizQuestions = questions;
        await _context.Quizzes.AddAsync(quiz);
        await _context.SaveChangesAsync();

        return Ok(MapQuizDto(quiz, author.Id));
    }

    [HttpPost("generate-ai")]
    [AllowAnonymous]
    public async Task<IActionResult> GenerateWithAi([FromBody] GenerateAiQuizRequest request)
    {
        var topic = string.IsNullOrWhiteSpace(request.TopicTitle)
            ? "Boas Práticas Operacionais e Segurança NextStep"
            : request.TopicTitle.Trim();

        var category = string.IsNullOrWhiteSpace(request.Category) ? "Geral" : request.Category.Trim();
        var modality = string.IsNullOrWhiteSpace(request.Modality) ? "Múltipla Escolha (Quiz)" : request.Modality.Trim();
        var level = Math.Clamp(request.Level, 0, 2);
        var xp = request.XpAmount > 0 ? request.XpAmount : (level == 0 ? 50 : level == 1 ? 80 : 120);

        var generatedQuestions = BuildAiQuestionsForTopic(topic, category, modality, level);

        if (request.SaveToDatabase)
        {
            var createReq = new CreateQuizRequest
            {
                Title = $"Quiz IA: {topic}",
                Description = $"Avaliação gerada por IA a partir da base \"{topic}\" ({modality}).",
                Category = category,
                Modality = modality,
                SourceTitle = topic,
                XpAmount = xp,
                Level = level,
                ActivityType = modality.Contains("Aberta", StringComparison.OrdinalIgnoreCase) ||
                               modality.Contains("Dissertativa", StringComparison.OrdinalIgnoreCase)
                    ? 1
                    : 0,
                Questions = generatedQuestions
            };
            return await Create(createReq);
        }

        return Ok(new
        {
            title = $"Quiz IA: {topic}",
            description = $"Avaliação interativa gerada por IA sobre \"{topic}\".",
            category,
            modality,
            xpAmount = xp,
            level,
            questions = generatedQuestions
        });
    }

    [HttpPost("{id:guid}/submit")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitQuiz(Guid id, [FromBody] SubmitQuizAttemptRequest request)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Activity)
            .Include(q => q.QuizQuestions)
                .ThenInclude(qq => qq.Options)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz == null) return NotFound(new { message = "Quiz não encontrado." });

        var user = await GetOrFallbackUserAsync(request.UserId);
        if (user == null) return Unauthorized();

        var totalQuestions = quiz.QuizQuestions.Count;
        int correctCount = 0;
        var questionFeedback = new List<object>();

        foreach (var question in quiz.QuizQuestions)
        {
            var submitted = request.Answers?.FirstOrDefault(a => a.QuestionId == question.Id);
            var correctOption = question.Options.FirstOrDefault(o => o.IsCorrect);
            bool isCorrect = false;
            string userAnswerText = "Não respondida";

            if (submitted != null)
            {
                if (submitted.SelectedOptionId.HasValue)
                {
                    var chosenOpt = question.Options.FirstOrDefault(o => o.Id == submitted.SelectedOptionId.Value);
                    if (chosenOpt != null)
                    {
                        userAnswerText = chosenOpt.OptionText;
                        isCorrect = chosenOpt.IsCorrect;
                    }
                }
                else if (!string.IsNullOrWhiteSpace(submitted.AnswerText))
                {
                    userAnswerText = submitted.AnswerText.Trim();
                    if (correctOption != null)
                    {
                        // Check if open/fill-blank answer matches or has >= 12 chars
                        isCorrect = userAnswerText.Equals(correctOption.OptionText, StringComparison.OrdinalIgnoreCase) ||
                                    correctOption.OptionText.Contains(userAnswerText, StringComparison.OrdinalIgnoreCase) ||
                                    userAnswerText.Length >= 15;
                    }
                    else
                    {
                        isCorrect = userAnswerText.Length >= 12;
                    }
                }
            }

            if (isCorrect) correctCount++;

            questionFeedback.Add(new
            {
                questionId = question.Id,
                questionText = question.QuestionText,
                userAnswer = userAnswerText,
                correctAnswer = correctOption?.OptionText ?? "Resposta discursiva avaliada",
                isCorrect
            });
        }

        int scorePercentage = totalQuestions > 0
            ? (int)Math.Round((double)correctCount / totalQuestions * 100)
            : 100;

        bool passed = scorePercentage >= 60;
        int baseXp = quiz.Activity?.XpAmount ?? 60;
        int xpEarned = passed
            ? Math.Max(15, (int)Math.Round(baseXp * (scorePercentage / 100.0)))
            : 10; // Consolation XP for participation

        if (quiz.Activity != null)
        {
            var existingUa = await _context.UserActivities
                .FirstOrDefaultAsync(ua => ua.UserId == user.Id && ua.ActivityId == quiz.ActivityId);

            if (existingUa == null)
            {
                existingUa = new UserActivity
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    ActivityId = quiz.ActivityId,
                    Score = scorePercentage,
                    Completed = true,
                    AssignedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow
                };
                await _context.UserActivities.AddAsync(existingUa);
            }
            else
            {
                existingUa.Score = Math.Max(existingUa.Score, scorePercentage);
                existingUa.Completed = true;
                existingUa.CompletedAt = DateTime.UtcNow;
            }
        }

        var logPayload = JsonSerializer.Serialize(new
        {
            quizId = quiz.Id,
            quizTitle = quiz.Title,
            scorePercentage,
            correctCount,
            totalQuestions,
            xpEarned,
            qaList = questionFeedback
        });

        await _context.LearningLogs.AddAsync(new LearningLog
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Action = "QUIZ_ATTEMPT",
            Details = logPayload.Length > 990 ? logPayload.Substring(0, 990) : logPayload,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        await _userStatsService.IncrementActivitiesCompletedAsync(user.Id);
        await _userStatsService.AddXpAsync(user.Id, xpEarned);

        // Emblemas são avaliados e atribuídos exclusivamente em background pelo BadgeSchedulerWorker
        return Ok(new
        {
            quizId = quiz.Id,
            quizTitle = quiz.Title,
            scorePercentage,
            correctCount,
            totalQuestions,
            passed,
            xpEarned,
            questionResults = questionFeedback
        });
    }

    [HttpPost("{id:guid}/assign")]
    [AllowAnonymous]
    public async Task<IActionResult> AssignUsers(Guid id, [FromBody] AssignQuizUsersRequest request)
    {
        var quiz = await _context.Quizzes.Include(q => q.Activity).FirstOrDefaultAsync(q => q.Id == id);
        if (quiz == null) return NotFound();

        var targetUserIds = request.UserIds ?? new List<Guid>();
        int assignedCount = 0;

        foreach (var uid in targetUserIds)
        {
            var exists = await _context.UserActivities
                .AnyAsync(ua => ua.UserId == uid && ua.ActivityId == quiz.ActivityId);
            if (!exists)
            {
                await _context.UserActivities.AddAsync(new UserActivity
                {
                    Id = Guid.NewGuid(),
                    UserId = uid,
                    ActivityId = quiz.ActivityId,
                    Score = 0,
                    Completed = false,
                    AssignedAt = DateTime.UtcNow
                });
                assignedCount++;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { assignedCount, totalSelected = targetUserIds.Count });
    }

    [HttpGet("user-attempts/{userId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserAttempts(Guid userId)
    {
        var logs = await _context.LearningLogs
            .Where(l => l.UserId == userId && l.Action == "QUIZ_ATTEMPT")
            .OrderByDescending(l => l.CreatedAt)
            .Take(25)
            .ToListAsync();

        var attempts = new List<object>();
        foreach (var log in logs)
        {
            if (string.IsNullOrWhiteSpace(log.Details)) continue;
            try
            {
                var doc = JsonSerializer.Deserialize<JsonElement>(log.Details);
                attempts.Add(new
                {
                    id = log.Id,
                    createdAt = log.CreatedAt,
                    details = doc
                });
            }
            catch
            {
                // ignore malformed json
            }
        }

        return Ok(attempts);
    }

    [HttpDelete("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Delete(Guid id)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.QuizQuestions)
                .ThenInclude(qq => qq.Options)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz == null) return NotFound();

        _context.Quizzes.Remove(quiz);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(idStr, out var g) ? g : null;
    }

    private async Task<User?> GetOrFallbackUserAsync(Guid? explicitUserId = null)
    {
        if (explicitUserId.HasValue && explicitUserId.Value != Guid.Empty)
        {
            var u = await _context.Users.FindAsync(explicitUserId.Value);
            if (u != null) return u;
        }

        var claimId = GetCurrentUserId();
        if (claimId.HasValue)
        {
            var u = await _context.Users.FindAsync(claimId.Value);
            if (u != null) return u;
        }

        return await _context.Users.FirstOrDefaultAsync();
    }

    private static string BuildQuizMetadataDescription(
        string? description,
        string? category,
        string? modality,
        string? sourceTitle)
    {
        var desc = string.IsNullOrWhiteSpace(description) ? "Avaliação técnica interativa" : description.Trim();
        var cat = string.IsNullOrWhiteSpace(category) ? "Geral" : category.Trim();
        var mod = string.IsNullOrWhiteSpace(modality) ? "Múltipla Escolha" : modality.Trim();
        var src = string.IsNullOrWhiteSpace(sourceTitle) ? "Base NextStep" : sourceTitle.Trim();
        return $"{desc}\n||META||{cat}||{mod}||{src}";
    }

    private static object MapQuizDto(Quiz q, Guid? currentUserId)
    {
        var rawDesc = q.Description ?? q.Activity?.Description ?? "";
        var cleanDesc = rawDesc;
        var category = q.Activity?.Process?.Category?.Name
                       ?? q.Activity?.Content?.Category?.Name
                       ?? "Geral";
        var modality = q.Activity?.Type == ActivityType.OpenQuestion ? "Dissertativa" : "Múltipla Escolha";
        var sourceTitle = q.Activity?.Process?.Title ?? q.Activity?.Content?.Title ?? "Base de Conhecimento";

        if (rawDesc.Contains("\n||META||"))
        {
            var parts = rawDesc.Split("\n||META||", 2);
            cleanDesc = parts[0];
            var metaParts = parts[1].Split("||");
            if (metaParts.Length >= 1 && !string.IsNullOrWhiteSpace(metaParts[0])) category = metaParts[0];
            if (metaParts.Length >= 2 && !string.IsNullOrWhiteSpace(metaParts[1])) modality = metaParts[1];
            if (metaParts.Length >= 3 && !string.IsNullOrWhiteSpace(metaParts[2])) sourceTitle = metaParts[2];
        }

        UserActivity? userAct = null;
        if (currentUserId.HasValue && q.Activity?.UserActivities != null)
        {
            userAct = q.Activity.UserActivities.FirstOrDefault(ua => ua.UserId == currentUserId.Value);
        }

        var levelInt = (int)(q.Activity?.Level ?? TechnicalLevel.Beginner);

        return new
        {
            id = q.Id,
            activityId = q.ActivityId,
            title = q.Title,
            description = cleanDesc,
            category,
            modality,
            sourceTitle,
            xpAmount = q.Activity?.XpAmount ?? 60,
            level = levelInt,
            levelLabel = levelInt == 0 ? "Iniciante" : levelInt == 1 ? "Intermediário" : "Avançado",
            authorName = q.Activity?.Author?.FullName ?? "Liderança Técnica",
            questionsCount = q.QuizQuestions?.Count ?? 0,
            assignedUsersCount = q.Activity?.UserActivities?.Count ?? 0,
            userCompleted = userAct?.Completed ?? false,
            userScore = userAct?.Score ?? 0,
            createdAt = q.CreatedAt,
            questions = (q.QuizQuestions ?? new List<QuizQuestion>())
                .OrderBy(qq => qq.CreatedAt)
                .Select(qq => new
                {
                    id = qq.Id,
                    questionText = qq.QuestionText,
                    options = (qq.Options ?? new List<QuizOption>())
                        .Select(o => new
                        {
                            id = o.Id,
                            optionText = o.OptionText,
                            isCorrect = o.IsCorrect
                        })
                        .ToList()
                })
                .ToList()
        };
    }

    private static List<CreateQuizQuestionRequest> BuildAiQuestionsForTopic(
        string topic,
        string category,
        string modality,
        int level)
    {
        if (modality.Contains("Preencher Lacunas", StringComparison.OrdinalIgnoreCase))
        {
            return new List<CreateQuizQuestionRequest>
            {
                new()
                {
                    QuestionText = $"Complete a lacuna sobre \"{topic}\": Na padronização corporativa de {category}, toda etapa crítica deve possuir registro de __________ e validação técnica.",
                    Options = new List<CreateQuizOptionRequest>
                    {
                        new() { OptionText = "auditoria e conformidade", IsCorrect = true },
                        new() { OptionText = "improviso manual", IsCorrect = false },
                        new() { OptionText = "exclusão de histórico", IsCorrect = false },
                        new() { OptionText = "acesso anônimo", IsCorrect = false }
                    }
                },
                new()
                {
                    QuestionText = $"Complete a lacuna: Caso ocorra uma exceção durante a execução de \"{topic}\", o colaborador deve consultar imediatamente a __________.",
                    Options = new List<CreateQuizOptionRequest>
                    {
                        new() { OptionText = "Central de Erros Conhecidos e Base Colaborativa", IsCorrect = true },
                        new() { OptionText = "planilha pessoal offline", IsCorrect = false },
                        new() { OptionText = "configuração de fábrica sem backup", IsCorrect = false },
                        new() { OptionText = "fila de descarte", IsCorrect = false }
                    }
                },
                new()
                {
                    QuestionText = $"Complete a lacuna: A homologação final do fluxo \"{topic}\" garante rastreabilidade e __________ para toda a equipe.",
                    Options = new List<CreateQuizOptionRequest>
                    {
                        new() { OptionText = "segurança operacional", IsCorrect = true },
                        new() { OptionText = "redundância desnecessária", IsCorrect = false },
                        new() { OptionText = "bloqueio de leitura", IsCorrect = false },
                        new() { OptionText = "perda de contexto", IsCorrect = false }
                    }
                }
            };
        }

        if (modality.Contains("Arrastar", StringComparison.OrdinalIgnoreCase))
        {
            return new List<CreateQuizQuestionRequest>
            {
                new()
                {
                    QuestionText = $"[Ordenação / Associação] Qual é a sequência correta de execução recomendada no documento \"{topic}\"?",
                    Options = new List<CreateQuizOptionRequest>
                    {
                        new() { OptionText = "1º Triagem de requisitos → 2º Execução padronizada → 3º Revisão técnica → 4º Homologação e registro", IsCorrect = true },
                        new() { OptionText = "1º Homologação → 2º Execução sem triagem → 3º Descarte de logs", IsCorrect = false },
                        new() { OptionText = "1º Publicação direta → 2º Correção apenas após falha em produção", IsCorrect = false },
                        new() { OptionText = "1º Exclusão de backup → 2º Alteração manual no servidor", IsCorrect = false }
                    }
                },
                new()
                {
                    QuestionText = $"[Associação de Conceitos] Associe corretamente a responsabilidade principal dentro do tema \"{topic}\":",
                    Options = new List<CreateQuizOptionRequest>
                    {
                        new() { OptionText = "Colaborador documenta evidências e segue o checklist; Liderança valida conformidade e métricas", IsCorrect = true },
                        new() { OptionText = "Apenas fornecedores externos podem consultar o procedimento interno", IsCorrect = false },
                        new() { OptionText = "Nenhuma etapa precisa ser marcada no checklist interativo", IsCorrect = false },
                        new() { OptionText = "O processo deve ser refeito do zero a cada chamada", IsCorrect = false }
                    }
                }
            };
        }

        if (modality.Contains("Verdadeiro", StringComparison.OrdinalIgnoreCase))
        {
            return new List<CreateQuizQuestionRequest>
            {
                new()
                {
                    QuestionText = $"Julgue a afirmação sobre \"{topic}\": É obrigatório seguir todas as etapas de verificação e registrar anomalias na Base Colaborativa para preservar o conhecimento do time.",
                    Options = new List<CreateQuizOptionRequest>
                    {
                        new() { OptionText = "Verdadeiro — Garante qualidade, rastreabilidade e aprendizado contínuo.", IsCorrect = true },
                        new() { OptionText = "Falso — A documentação é opcional mesmo em processos críticos.", IsCorrect = false }
                    }
                },
                new()
                {
                    QuestionText = $"Julgue a afirmação: Em \"{topic}\", alterações em produção ou mudanças de fluxo podem ser aplicadas sem revisão ou validação prévia.",
                    Options = new List<CreateQuizOptionRequest>
                    {
                        new() { OptionText = "Falso — Toda mudança exige validação técnica e homologação.", IsCorrect = true },
                        new() { OptionText = "Verdadeiro — Qualquer alteração pode ir direto sem testes.", IsCorrect = false }
                    }
                }
            };
        }

        // Default: Multi-question Multiple Choice Quiz (3 questions)
        return new List<CreateQuizQuestionRequest>
        {
            new()
            {
                QuestionText = $"Com base no documento \"{topic}\" ({category}), qual é o objetivo primordial da padronização deste procedimento na NextStep?",
                Options = new List<CreateQuizOptionRequest>
                {
                    new() { OptionText = "Garantir consistência operacional, reduzir retrabalho e preservar o conhecimento técnico da equipe.", IsCorrect = true },
                    new() { OptionText = "Aumentar a burocracia interna sem impacto na qualidade final das entregas.", IsCorrect = false },
                    new() { OptionText = "Centralizar a informação em apenas um colaborador sem compartilhamento.", IsCorrect = false },
                    new() { OptionText = "Eliminar a necessidade de validação técnica e testes de qualidade.", IsCorrect = false }
                }
            },
            new()
            {
                QuestionText = $"Durante a aplicação prática de \"{topic}\", qual é a conduta recomendada ao identificar um comportamento inesperado ou gargalo recorrente?",
                Options = new List<CreateQuizOptionRequest>
                {
                    new() { OptionText = "Consultar a Central de Erros Conhecidos, aplicar a contenção homologada e documentar o aprendizado.", IsCorrect = true },
                    new() { OptionText = "Ignorar o alerta caso o sistema continue respondendo parcialmente.", IsCorrect = false },
                    new() { OptionText = "Desativar os mecanismos de monitoramento e logs de auditoria.", IsCorrect = false },
                    new() { OptionText = "Aguardar o encerramento do trimestre para comunicar a equipe.", IsCorrect = false }
                }
            },
            new()
            {
                QuestionText = $"Qual indicador confirma que a execução de \"{topic}\" atingiu o padrão de qualidade esperado (Nível {(level == 0 ? "Iniciante" : level == 1 ? "Intermediário" : "Avançado")})?",
                Options = new List<CreateQuizOptionRequest>
                {
                    new() { OptionText = "Todas as etapas do checklist validadas em conformidade com os critérios técnicos e de segurança.", IsCorrect = true },
                    new() { OptionText = "Execução parcial sem conferência dos requisitos de entrada.", IsCorrect = false },
                    new() { OptionText = "Aprovação informal sem registro na plataforma.", IsCorrect = false },
                    new() { OptionText = "Ausência de métricas ou evidências de conclusão.", IsCorrect = false }
                }
            }
        };
    }

    private async Task EnsureDefaultQuizzesSeededAsync()
    {
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin)
                    ?? await _context.Users.FirstOrDefaultAsync();
        if (admin == null) return;

        var processes = await _context.Processes.Include(p => p.Category).ToListAsync();
        var firstProc = processes.FirstOrDefault();

        var defaultQuizzes = new List<(string Title, string Desc, string Category, string Modality, string Source, int Xp, TechnicalLevel Level, List<CreateQuizQuestionRequest> Questions)>
        {
            (
                "Quiz de Segurança da Informação, Incidentes e LGPD",
                "Avalie seu domínio sobre resposta a incidentes, proteção de dados pessoais (LGPD) e credenciais corporativas.",
                "Segurança",
                "Múltipla Escolha (Quiz)",
                "Resposta a Incidentes de Segurança e LGPD",
                100,
                TechnicalLevel.Intermediate,
                new List<CreateQuizQuestionRequest>
                {
                    new()
                    {
                        QuestionText = "Ao identificar um incidente de vazamento ou comprometimento de credencial em produção, qual é o primeiro passo obrigatório?",
                        Options = new List<CreateQuizOptionRequest>
                        {
                            new() { OptionText = "Isolar imediatamente o serviço ou revogar a credencial afetada e acionar o canal de resposta rápida.", IsCorrect = true },
                            new() { OptionText = "Aguardar 24 horas para verificar se o acesso indevido se repete.", IsCorrect = false },
                            new() { OptionText = "Apagar os logs de auditoria do servidor para liberar espaço.", IsCorrect = false },
                            new() { OptionText = "Compartilhar a senha antiga no chat geral para conferência.", IsCorrect = false }
                        }
                    },
                    new()
                    {
                        QuestionText = "De acordo com a LGPD e as diretrizes NextStep, como devem ser tratadas senhas temporárias geradas pela Administração?",
                        Options = new List<CreateQuizOptionRequest>
                        {
                            new() { OptionText = "Devem exigir troca obrigatória no primeiro login por uma senha forte exclusiva do colaborador.", IsCorrect = true },
                            new() { OptionText = "Podem ser mantidas permanentemente sem necessidade de alteração.", IsCorrect = false },
                            new() { OptionText = "Não precisam conter caracteres especiais nem letras maiúsculas.", IsCorrect = false },
                            new() { OptionText = "Podem ser compartilhadas entre membros do mesmo setor.", IsCorrect = false }
                        }
                    },
                    new()
                    {
                        QuestionText = "Após a contenção e correção de um incidente crítico, onde a equipe deve registrar a causa raiz e a solução definitiva?",
                        Options = new List<CreateQuizOptionRequest>
                        {
                            new() { OptionText = "Na Base de Conhecimento Colaborativa (Erro Comum / Estudo de Caso) para prevenir recorrências.", IsCorrect = true },
                            new() { OptionText = "Apenas em anotações locais na máquina do desenvolvedor.", IsCorrect = false },
                            new() { OptionText = "Não é necessário documentar incidentes já resolvidos.", IsCorrect = false },
                            new() { OptionText = "Somente em relatórios anuais externos.", IsCorrect = false }
                        }
                    }
                }
            ),
            (
                "Quiz de Arquitetura: Webhooks, Filas Assíncronas e CI/CD AWS",
                "Teste seus conhecimentos sobre resiliência de APIs, desacoplamento com filas e deploy contínuo em nuvem.",
                "Técnico",
                "Múltipla Escolha (Quiz)",
                "Deploy Contínuo em Produção (CI/CD AWS)",
                120,
                TechnicalLevel.Advanced,
                new List<CreateQuizQuestionRequest>
                {
                    new()
                    {
                        QuestionText = "Qual padrão arquitetural resolve falhas de timeout quando um webhook externo depende de processamento em um sistema legado lento?",
                        Options = new List<CreateQuizOptionRequest>
                        {
                            new() { OptionText = "Responder HTTP 200 imediatamente após validar a assinatura e enfileirar o evento (RabbitMQ/SQS) para processamento assíncrono.", IsCorrect = true },
                            new() { OptionText = "Aumentar o timeout da requisição síncrona para 10 minutos.", IsCorrect = false },
                            new() { OptionText = "Desabilitar a validação de segurança do webhook.", IsCorrect = false },
                            new() { OptionText = "Bloquear novas requisições até o banco legado responder.", IsCorrect = false }
                        }
                    },
                    new()
                    {
                        QuestionText = "Para evitar duplicidade no processamento de mensagens em filas com política de retry, qual técnica é indispensável?",
                        Options = new List<CreateQuizOptionRequest>
                        {
                            new() { OptionText = "Garantir idempotência utilizando uma chave única do evento (event_id).", IsCorrect = true },
                            new() { OptionText = "Desligar todas as retentativas automáticas.", IsCorrect = false },
                            new() { OptionText = "Reiniciar o banco de dados a cada webhook recebido.", IsCorrect = false },
                            new() { OptionText = "Executar apenas em horário comercial.", IsCorrect = false }
                        }
                    },
                    new()
                    {
                        QuestionText = "No fluxo de Deploy Contínuo na AWS da NextStep, o que deve ser validado imediatamente após o push da imagem Docker e atualização do container?",
                        Options = new List<CreateQuizOptionRequest>
                        {
                            new() { OptionText = "O endpoint de healthcheck (/api/health) e a conectividade com o banco RDS MySQL.", IsCorrect = true },
                            new() { OptionText = "A exclusão manual das tabelas de produção.", IsCorrect = false },
                            new() { OptionText = "A desativação do certificado SSL.", IsCorrect = false },
                            new() { OptionText = "O bloqueio do bucket S3 de imagens.", IsCorrect = false }
                        }
                    }
                }
            ),
            (
                "Quiz de Padronização Editorial, Metadados e SEO",
                "Verifique seu conhecimento sobre revisão editorial, acessibilidade em imagens e indexação.",
                "Editorial",
                "Preencher Lacunas",
                "Fluxo de Revisão Editorial",
                80,
                TechnicalLevel.Beginner,
                new List<CreateQuizQuestionRequest>
                {
                    new()
                    {
                        QuestionText = "Complete a lacuna: Para garantir acessibilidade e indexação correta, todas as imagens publicadas devem possuir o atributo __________ descritivo.",
                        Options = new List<CreateQuizOptionRequest>
                        {
                            new() { OptionText = "alt (texto alternativo)", IsCorrect = true },
                            new() { OptionText = "hidden", IsCorrect = false },
                            new() { OptionText = " autoplay", IsCorrect = false },
                            new() { OptionText = "script", IsCorrect = false }
                        }
                    },
                    new()
                    {
                        QuestionText = "Complete a lacuna: Antes de exportar ativos visuais para a web, o perfil de cores deve ser convertido de CMYK para __________.",
                        Options = new List<CreateQuizOptionRequest>
                        {
                            new() { OptionText = "sRGB (formatos otimizados WebP/PNG)", IsCorrect = true },
                            new() { OptionText = "BMP sem compressão", IsCorrect = false },
                            new() { OptionText = "RAW de impressão", IsCorrect = false },
                            new() { OptionText = "TIFF monocromático", IsCorrect = false }
                        }
                    }
                }
            )
        };

        foreach (var item in defaultQuizzes)
        {
            var act = new Activity
            {
                Id = Guid.NewGuid(),
                Title = item.Title,
                Description = item.Desc,
                Type = ActivityType.Quiz,
                XpAmount = item.Xp,
                Level = item.Level,
                ProcessId = firstProc?.Id,
                AuthorId = admin.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _context.Activities.AddAsync(act);

            var quiz = new Quiz
            {
                Id = Guid.NewGuid(),
                Title = item.Title,
                Description = BuildQuizMetadataDescription(item.Desc, item.Category, item.Modality, item.Source),
                ActivityId = act.Id,
                CreatedAt = DateTime.UtcNow
            };

            var qEntities = new List<QuizQuestion>();
            foreach (var q in item.Questions)
            {
                var qq = new QuizQuestion
                {
                    Id = Guid.NewGuid(),
                    QuizId = quiz.Id,
                    QuestionText = q.QuestionText,
                    CreatedAt = DateTime.UtcNow,
                    Options = q.Options.Select(o => new QuizOption
                    {
                        Id = Guid.NewGuid(),
                        OptionText = o.OptionText,
                        IsCorrect = o.IsCorrect,
                        CreatedAt = DateTime.UtcNow
                    }).ToList()
                };
                qEntities.Add(qq);
            }

            quiz.QuizQuestions = qEntities;
            await _context.Quizzes.AddAsync(quiz);
        }

        await _context.SaveChangesAsync();
    }
}

public class CreateQuizRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Modality { get; set; }
    public string? SourceTitle { get; set; }
    public int XpAmount { get; set; } = 60;
    public int Level { get; set; } = 0;
    public int ActivityType { get; set; } = 0;
    public Guid? ProcessId { get; set; }
    public Guid? ContentId { get; set; }
    public List<CreateQuizQuestionRequest> Questions { get; set; } = new();
}

public class CreateQuizQuestionRequest
{
    public string QuestionText { get; set; } = string.Empty;
    public List<CreateQuizOptionRequest> Options { get; set; } = new();
}

public class CreateQuizOptionRequest
{
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class GenerateAiQuizRequest
{
    public string TopicTitle { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Modality { get; set; }
    public int Level { get; set; } = 1;
    public int XpAmount { get; set; } = 80;
    public bool SaveToDatabase { get; set; } = true;
}

public class SubmitQuizAttemptRequest
{
    public Guid? UserId { get; set; }
    public List<SubmittedQuizAnswerItem> Answers { get; set; } = new();
}

public class SubmittedQuizAnswerItem
{
    public Guid QuestionId { get; set; }
    public Guid? SelectedOptionId { get; set; }
    public string? AnswerText { get; set; }
}

public class AssignQuizUsersRequest
{
    public List<Guid> UserIds { get; set; } = new();
}
