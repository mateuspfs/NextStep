using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProcessesController : ControllerBase
{
    private readonly NextStepDbContext _context;

    public ProcessesController(NextStepDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        if (!await _context.Processes.AnyAsync())
        {
            await EnsureDefaultProcessesSeededAsync();
        }

        var processes = await _context.Processes
            .Include(p => p.Category)
            .Include(p => p.Author)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var result = processes.Select(MapProcess).ToList();
        return Ok(result);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateProcessRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new { message = "Título e descrição são obrigatórios." });
        }

        var categoryName = string.IsNullOrWhiteSpace(request.Category) ? "Editorial" : request.Category.Trim();
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Name == categoryName);
        if (category == null)
        {
            category = new Category
            {
                Id = Guid.NewGuid(),
                Name = categoryName,
                Description = $"Processos de {categoryName}",
                CreatedAt = DateTime.UtcNow
            };
            await _context.Categories.AddAsync(category);
            await _context.SaveChangesAsync();
        }

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        User? author = null;
        if (Guid.TryParse(userIdStr, out var parsedUserId))
        {
            author = await _context.Users.FindAsync(parsedUserId);
        }

        if (author == null)
        {
            author = await _context.Users.FirstOrDefaultAsync();
            if (author == null)
            {
                return BadRequest(new { message = "Nenhum usuário base encontrado." });
            }
        }

        var steps = request.Steps != null && request.Steps.Any(s => !string.IsNullOrWhiteSpace(s))
            ? request.Steps.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList()
            : new List<string>
            {
                "Etapa inicial de solicitação e triagem",
                "Processamento e execução operacional padronizada",
                "Revisão técnica e homologação de qualidade"
            };

        var storedDescription = request.Description.Trim() + "\n||STEPS||" + string.Join("||", steps);

        var process = new Process
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Subtitle = string.IsNullOrWhiteSpace(request.Subtitle) ? "Processo operacional documentado" : request.Subtitle.Trim(),
            Description = storedDescription,
            CategoryId = category.Id,
            Category = category,
            AuthorId = author.Id,
            Author = author,
            Status = ProcessStatus.Approved,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Processes.AddAsync(process);
        await _context.SaveChangesAsync();

        return Ok(MapProcess(process));
    }

    private async Task EnsureDefaultProcessesSeededAsync()
    {
        var categories = await _context.Categories.ToListAsync();
        var users = await _context.Users.ToListAsync();
        if (!categories.Any() || !users.Any()) return;

        var editorial = categories.FirstOrDefault(c => c.Name == "Editorial") ?? categories.First();
        var tecnico = categories.FirstOrDefault(c => c.Name == "Técnico") ?? categories.First();
        var seguranca = categories.FirstOrDefault(c => c.Name == "Segurança") ?? categories.First();

        var financeiro = categories.FirstOrDefault(c => c.Name == "Financeiro");
        if (financeiro == null)
        {
            financeiro = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Financeiro",
                Description = "Processos financeiros, controladoria e repasses",
                CreatedAt = DateTime.UtcNow
            };
            await _context.Categories.AddAsync(financeiro);
            await _context.SaveChangesAsync();
        }

        var ana = users.FirstOrDefault(u => u.FullName.Contains("Ana")) ?? users.First();
        var carlos = users.FirstOrDefault(u => u.FullName.Contains("Carlos")) ?? users.First();
        var maria = users.FirstOrDefault(u => u.FullName.Contains("Maria")) ?? users.First();
        var pedro = users.FirstOrDefault(u => u.FullName.Contains("Pedro")) ?? users.First();
        var luis = users.FirstOrDefault(u => u.Role == UserRole.Admin) ?? users.First();

        var processes = new List<Process>
        {
            new Process
            {
                Id = Guid.NewGuid(),
                Title = "Fluxo de Revisão Editorial",
                Subtitle = "Processo de revisão e aprovação de conteúdo editorial",
                Description = "Fluxo completo para revisão técnica, ortográfica e aprovação de conteúdos editoriais antes da publicação na plataforma.\n||STEPS||Submissão do rascunho pelo autor||Análise de conformidade e tom de voz editorial||Validação técnica e revisão ortográfica||Aprovação final e agendamento de publicação",
                CategoryId = editorial.Id,
                AuthorId = ana.Id,
                Status = ProcessStatus.Approved,
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                UpdatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new Process
            {
                Id = Guid.NewGuid(),
                Title = "Pipeline de Recursos Visuais",
                Subtitle = "Pipeline de processamento e otimização de imagens",
                Description = "Processamento automatizado de imagens para compressão sem perda, geração de formatos modernos (WebP/AVIF) e padronização.\n||STEPS||Upload dos ativos originais em alta resolução||Validação de proporção e perfil de cor sRGB||Compressão automatizada e geração de miniaturas||Disponibilização na CDN",
                CategoryId = tecnico.Id,
                AuthorId = carlos.Id,
                Status = ProcessStatus.Approved,
                CreatedAt = DateTime.UtcNow.AddDays(-8),
                UpdatedAt = DateTime.UtcNow.AddDays(-8)
            },
            new Process
            {
                Id = Guid.NewGuid(),
                Title = "Pagamento de Colaboradores",
                Subtitle = "Processo de homologação e repasse a prestadores",
                Description = "Fluxo seguro de conferência de entregas, validação fiscal e execução de repasses para contribuidores externos e especialistas.\n||STEPS||Recebimento e conferência da nota fiscal||Validação da entrega pela gerência de área||Agendamento bancário no sistema financeiro||Envio do comprovante de liquidação",
                CategoryId = financeiro.Id,
                AuthorId = maria.Id,
                Status = ProcessStatus.Approved,
                CreatedAt = DateTime.UtcNow.AddDays(-6),
                UpdatedAt = DateTime.UtcNow.AddDays(-6)
            },
            new Process
            {
                Id = Guid.NewGuid(),
                Title = "Validação de Metadados e SEO",
                Subtitle = "Verificação de indexação e acessibilidade",
                Description = "Processo de conferência de palavras-chave, meta tags Open Graph, tags canônicas e textos alternativos para acessibilidade.\n||STEPS||Auditoria de tags title, description e heading hierarchy||Verificação de imagens com atributo alt descritivo||Teste de visualização em redes sociais (Open Graph)||Validação de links canônicos e sitemap",
                CategoryId = tecnico.Id,
                AuthorId = pedro.Id,
                Status = ProcessStatus.Approved,
                CreatedAt = DateTime.UtcNow.AddDays(-4),
                UpdatedAt = DateTime.UtcNow.AddDays(-4)
            },
            new Process
            {
                Id = Guid.NewGuid(),
                Title = "Resposta a Incidentes de Segurança e LGPD",
                Subtitle = "Protocolo imediato de contenção, diagnóstico e notificação",
                Description = "Procedimento operacional padrão para tratamento de incidentes de segurança da informação e proteção de dados pessoais.\n||STEPS||Isolamento imediato do serviço ou credencial afetada||Abertura de sala de crise e coleta de logs de auditoria||Aplicação de patch corretivo e rotação de chaves||Documentação na Central de Erros Conhecidos e relatório de pós-incidente",
                CategoryId = seguranca.Id,
                AuthorId = luis.Id,
                Status = ProcessStatus.Approved,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-2)
            }
        };

        await _context.Processes.AddRangeAsync(processes);
        await _context.SaveChangesAsync();
    }

    private static object MapProcess(Process p)
    {
        var rawDesc = p.Description ?? string.Empty;
        var cleanDesc = rawDesc;
        var steps = new List<string>();

        if (rawDesc.Contains("\n||STEPS||"))
        {
            var parts = rawDesc.Split("\n||STEPS||", 2);
            cleanDesc = parts[0];
            if (parts.Length > 1 && !string.IsNullOrWhiteSpace(parts[1]))
            {
                steps = parts[1]
                    .Split("||", StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim())
                    .ToList();
            }
        }

        if (steps.Count == 0)
        {
            steps = new List<string>
            {
                "Submissão e conferência dos requisitos de entrada",
                "Execução conforme diretrizes da área responsável",
                "Validação técnica e revisão de conformidade",
                "Homologação final e registro de conclusão"
            };
        }

        return new
        {
            id = p.Id.ToString(),
            title = p.Title,
            subtitle = p.Subtitle,
            description = cleanDesc,
            category = p.Category?.Name ?? "Geral",
            author = p.Author?.FullName ?? "Equipe Interna",
            status = p.Status == ProcessStatus.Approved ? "Ativo" : p.Status == ProcessStatus.Pending ? "Em Revisão" : "Arquivado",
            steps,
            createdAt = p.CreatedAt
        };
    }
}

public class CreateProcessRequest
{
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "Editorial";
    public string? Author { get; set; }
    public List<string>? Steps { get; set; }
}
