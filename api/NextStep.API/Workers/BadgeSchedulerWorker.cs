using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NextStep.Application.Interfaces.Services;

namespace NextStep.API.Workers;

/// <summary>
/// Worker agendado em background que executa periodicamente as queries SQL de relatório
/// cadastradas na tabela Badges (coluna Criteria), atribuindo automaticamente os emblemas
/// aos colaboradores elegíveis que ainda não os possuem e registrando as notificações.
/// </summary>
public class BadgeSchedulerWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BadgeSchedulerWorker> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    public BadgeSchedulerWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<BadgeSchedulerWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[BadgeSchedulerWorker] Worker agendado de avaliação de relatórios de emblemas iniciado (intervalo: {Interval}s).", Interval.TotalSeconds);

        // Aguarda a inicialização do banco e seed na subida da API
        await Task.Delay(TimeSpan.FromSeconds(8), stoppingToken);

        using var timer = new PeriodicTimer(Interval);

        do
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var badgeService = scope.ServiceProvider.GetRequiredService<IBadgeService>();
                var awardedCount = await badgeService.EvaluateAllBadgesReportsAsync();

                if (awardedCount > 0)
                {
                    _logger.LogInformation("[BadgeSchedulerWorker] Ciclo concluído: {Count} novo(s) emblema(s) atribuído(s) via queries de relatório.", awardedCount);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[BadgeSchedulerWorker] Erro durante execução do ciclo de relatórios de emblemas.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
