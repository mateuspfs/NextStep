using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NextStep.Application.DTOs.Badges;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.Infrastructure.Services;

public class BadgeService : IBadgeService
{
    private readonly NextStepDbContext _dbContext;
    private readonly IBadgeRepository _badgeRepository;
    private readonly IUserBadgeRepository _userBadgeRepository;
    private readonly IUserStatsRepository _userStatsRepository;
    private readonly ILogger<BadgeService> _logger;

    private static readonly Regex ForbiddenSqlRegex = new(
        @"\b(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXEC|EXECUTE)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public BadgeService(
        NextStepDbContext dbContext,
        IBadgeRepository badgeRepository,
        IUserBadgeRepository userBadgeRepository,
        IUserStatsRepository userStatsRepository,
        ILogger<BadgeService> logger)
    {
        _dbContext = dbContext;
        _badgeRepository = badgeRepository;
        _userBadgeRepository = userBadgeRepository;
        _userStatsRepository = userStatsRepository;
        _logger = logger;
    }

    public async Task<IEnumerable<BadgeDto>> GetAllAsync()
    {
        var badges = await _badgeRepository.GetAllAsync();
        return badges.Select(MapToDto);
    }

    public async Task<IEnumerable<UserBadgeDto>> GetUserBadgesAsync(Guid userId)
    {
        var userBadges = await _userBadgeRepository.GetByUserAsync(userId);
        return userBadges.Select(MapToUserBadgeDto);
    }

    public async Task<bool> AwardBadgeAsync(Guid userId, Guid badgeId)
    {
        if (await _userBadgeRepository.HasBadgeAsync(userId, badgeId))
            return false;

        var badge = await _badgeRepository.GetByIdAsync(badgeId);
        if (badge == null)
            return false;

        var userBadge = new UserBadge
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BadgeId = badgeId,
            Badge = badge,
            EarnedAt = DateTime.UtcNow,
            IsDisplayed = true
        };

        await _userBadgeRepository.AddAsync(userBadge);

        var stats = await _userStatsRepository.GetOrCreateByUserAsync(userId);
        stats.BadgesEarned++;
        stats.UpdatedAt = DateTime.UtcNow;
        await _userStatsRepository.UpdateAsync(stats);

        await CreateBadgeNotificationLogAsync(userBadge, markAsUnread: true);
        return true;
    }

    public async Task<bool> CheckAndAwardBadgesAsync(Guid userId)
    {
        var newlyAwarded = await CheckAndAwardBadgesDetailedAsync(userId);
        return newlyAwarded.Count > 0;
    }

    public async Task<List<UserBadgeDto>> CheckAndAwardBadgesDetailedAsync(Guid userId)
    {
        // Executa a avaliação das queries de relatório dos emblemas e retorna os recém-premiados para este usuário
        await EvaluateAllBadgesReportsAsync(targetUserId: userId, markNotificationUnread: false);
        var unread = await ConsumeUnreadBadgeNotificationsAsync(userId);
        return unread;
    }

    /// <summary>
    /// Executa todas as queries de relatório cadastradas na coluna Criteria da tabela Badges.
    /// Seleciona todos os usuários que atendem à query e ainda não possuem o emblema,
    /// atribui o emblema na tabela UserBadges e registra a notificação para o colaborador.
    /// </summary>
    public async Task<int> EvaluateAllBadgesReportsAsync()
    {
        return await EvaluateAllBadgesReportsAsync(targetUserId: null, markNotificationUnread: true);
    }

    private async Task<int> EvaluateAllBadgesReportsAsync(Guid? targetUserId, bool markNotificationUnread)
    {
        var activeBadges = await _dbContext.Badges
            .Where(b => b.IsActive)
            .AsNoTracking()
            .ToListAsync();

        if (activeBadges.Count == 0)
            return 0;

        var commonUserIds = await _dbContext.Users
            .Where(u => u.Role == UserRole.Common && (!targetUserId.HasValue || u.Id == targetUserId.Value))
            .Select(u => u.Id)
            .ToListAsync();

        if (commonUserIds.Count == 0)
            return 0;

        var commonUserSet = new HashSet<Guid>(commonUserIds);

        var existingUserBadges = await _dbContext.UserBadges
            .Where(ub => !targetUserId.HasValue || ub.UserId == targetUserId.Value)
            .Select(ub => new { ub.BadgeId, ub.UserId })
            .ToListAsync();

        var existingMap = existingUserBadges
            .GroupBy(x => x.BadgeId)
            .ToDictionary(g => g.Key, g => new HashSet<Guid>(g.Select(x => x.UserId)));

        int totalAwarded = 0;

        foreach (var badge in activeBadges)
        {
            try
            {
                var matchedUserIds = await ExecuteBadgeReportQueryAsync(badge);
                if (matchedUserIds.Count == 0)
                    continue;

                if (!existingMap.TryGetValue(badge.Id, out var alreadyHasBadgeSet))
                {
                    alreadyHasBadgeSet = new HashSet<Guid>();
                    existingMap[badge.Id] = alreadyHasBadgeSet;
                }

                foreach (var uid in matchedUserIds)
                {
                    if (!commonUserSet.Contains(uid))
                        continue;

                    if (alreadyHasBadgeSet.Contains(uid))
                        continue;

                    alreadyHasBadgeSet.Add(uid);

                    var userBadge = new UserBadge
                    {
                        Id = Guid.NewGuid(),
                        UserId = uid,
                        BadgeId = badge.Id,
                        EarnedAt = DateTime.UtcNow,
                        IsDisplayed = true
                    };

                    _dbContext.UserBadges.Add(userBadge);

                    var stats = await _dbContext.UserStats.FirstOrDefaultAsync(s => s.UserId == uid);
                    if (stats != null)
                    {
                        stats.BadgesEarned++;
                        stats.UpdatedAt = DateTime.UtcNow;
                    }

                    var dto = new UserBadgeDto
                    {
                        Id = userBadge.Id,
                        UserId = uid,
                        BadgeId = badge.Id,
                        BadgeName = badge.Name,
                        BadgeDescription = badge.Description,
                        BadgeIconUrl = badge.IconUrl,
                        BadgeRarity = badge.Rarity.ToString(),
                        EarnedAt = userBadge.EarnedAt,
                        IsDisplayed = true
                    };

                    var detailsJson = JsonSerializer.Serialize(dto);
                    if (detailsJson.Length > 1000)
                    {
                        detailsJson = detailsJson.Substring(0, 1000);
                    }

                    _dbContext.LearningLogs.Add(new LearningLog
                    {
                        Id = Guid.NewGuid(),
                        UserId = uid,
                        Action = markNotificationUnread ? "BADGE_AWARDED_UNREAD" : "BADGE_AWARDED_UNREAD",
                        Details = detailsJson,
                        CreatedAt = DateTime.UtcNow
                    });

                    totalAwarded++;
                    _logger.LogInformation(
                        "[BadgeWorker] Emblema '{BadgeName}' atribuído automaticamente ao usuário {UserId} via query de relatório.",
                        badge.Name,
                        uid);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[BadgeWorker] Falha ao executar query de relatório do emblema '{BadgeName}' ({BadgeId}).", badge.Name, badge.Id);
            }
        }

        if (totalAwarded > 0)
        {
            await _dbContext.SaveChangesAsync();
        }

        return totalAwarded;
    }

    public async Task<List<UserBadgeDto>> ConsumeUnreadBadgeNotificationsAsync(Guid userId)
    {
        var unreadLogs = await _dbContext.LearningLogs
            .Where(l => l.UserId == userId && l.Action == "BADGE_AWARDED_UNREAD")
            .OrderBy(l => l.CreatedAt)
            .ToListAsync();

        if (unreadLogs.Count == 0)
            return new List<UserBadgeDto>();

        var result = new List<UserBadgeDto>();

        foreach (var log in unreadLogs)
        {
            log.Action = "BADGE_AWARDED_READ";
            if (!string.IsNullOrWhiteSpace(log.Details))
            {
                try
                {
                    var dto = JsonSerializer.Deserialize<UserBadgeDto>(log.Details);
                    if (dto != null)
                    {
                        result.Add(dto);
                    }
                }
                catch
                {
                    // ignore malformed json
                }
            }
        }

        await _dbContext.SaveChangesAsync();
        return result;
    }

    private async Task CreateBadgeNotificationLogAsync(UserBadge userBadge, bool markAsUnread)
    {
        var dto = MapToUserBadgeDto(userBadge);
        var detailsJson = JsonSerializer.Serialize(dto);
        if (detailsJson.Length > 1000)
        {
            detailsJson = detailsJson.Substring(0, 1000);
        }

        _dbContext.LearningLogs.Add(new LearningLog
        {
            Id = Guid.NewGuid(),
            UserId = userBadge.UserId,
            Action = markAsUnread ? "BADGE_AWARDED_UNREAD" : "BADGE_AWARDED_READ",
            Details = detailsJson,
            CreatedAt = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// Resolve a query SQL de relatório cadastrada no emblema (ou converte chaves legadas na query SQL correspondente).
    /// </summary>
    public static string ResolveBadgeReportSql(Badge badge)
    {
        var raw = badge.Criteria?.Trim() ?? string.Empty;

        // Se o dev cadastrou uma query SQL SELECT diretamente na coluna Criteria
        if (raw.StartsWith("SELECT ", StringComparison.OrdinalIgnoreCase))
        {
            if (ForbiddenSqlRegex.IsMatch(raw))
            {
                throw new InvalidOperationException("A query de relatório do emblema deve conter apenas instruções SELECT de leitura.");
            }
            return raw;
        }

        // Conversão automática de chaves/códigos para a query SQL equivalente no PostgreSQL
        switch (raw.ToLowerInvariant())
        {
            case "first_login":
                return @"SELECT u.""Id"" FROM ""Users"" u WHERE u.""Role"" = 0 AND NOT EXISTS (SELECT 1 FROM ""UserBadges"" ub WHERE ub.""UserId"" = u.""Id"" AND ub.""BadgeId"" = @BadgeId)";

            case "first_course":
                return @"SELECT u.""Id"" FROM ""Users"" u LEFT JOIN ""UserStats"" s ON s.""UserId"" = u.""Id"" WHERE u.""Role"" = 0 AND (COALESCE(s.""CoursesCompleted"", 0) >= 1 OR (@RequiredPoints > 0 AND (u.""NexPoints"" >= @RequiredPoints OR COALESCE(s.""TotalXp"", 0) >= @RequiredPoints))) AND NOT EXISTS (SELECT 1 FROM ""UserBadges"" ub WHERE ub.""UserId"" = u.""Id"" AND ub.""BadgeId"" = @BadgeId)";

            case "five_courses":
                return @"SELECT u.""Id"" FROM ""Users"" u LEFT JOIN ""UserStats"" s ON s.""UserId"" = u.""Id"" WHERE u.""Role"" = 0 AND (COALESCE(s.""CoursesCompleted"", 0) >= 5 OR (@RequiredPoints > 0 AND (u.""NexPoints"" >= @RequiredPoints OR COALESCE(s.""TotalXp"", 0) >= @RequiredPoints))) AND NOT EXISTS (SELECT 1 FROM ""UserBadges"" ub WHERE ub.""UserId"" = u.""Id"" AND ub.""BadgeId"" = @BadgeId)";

            case "quiz_master":
                return @"SELECT u.""Id"" FROM ""Users"" u LEFT JOIN ""UserStats"" s ON s.""UserId"" = u.""Id"" WHERE u.""Role"" = 0 AND (COALESCE(s.""ActivitiesCompleted"", 0) >= 5 OR (@RequiredPoints > 0 AND (u.""NexPoints"" >= @RequiredPoints OR COALESCE(s.""TotalXp"", 0) >= @RequiredPoints))) AND NOT EXISTS (SELECT 1 FROM ""UserBadges"" ub WHERE ub.""UserId"" = u.""Id"" AND ub.""BadgeId"" = @BadgeId)";

            case "streak_7":
                return @"SELECT u.""Id"" FROM ""Users"" u LEFT JOIN ""UserStats"" s ON s.""UserId"" = u.""Id"" WHERE u.""Role"" = 0 AND (COALESCE(s.""CurrentStreak"", 0) >= 7 OR COALESCE(s.""LongestStreak"", 0) >= 7 OR (@RequiredPoints > 0 AND (u.""NexPoints"" >= @RequiredPoints OR COALESCE(s.""TotalXp"", 0) >= @RequiredPoints))) AND NOT EXISTS (SELECT 1 FROM ""UserBadges"" ub WHERE ub.""UserId"" = u.""Id"" AND ub.""BadgeId"" = @BadgeId)";

            case "contributor":
                return @"SELECT u.""Id"" FROM ""Users"" u LEFT JOIN ""UserStats"" s ON s.""UserId"" = u.""Id"" WHERE u.""Role"" = 0 AND ((SELECT COUNT(*) FROM ""Contents"" c WHERE c.""AuthorId"" = u.""Id"") >= 5 OR (@RequiredPoints > 0 AND (u.""NexPoints"" >= @RequiredPoints OR COALESCE(s.""TotalXp"", 0) >= @RequiredPoints))) AND NOT EXISTS (SELECT 1 FROM ""UserBadges"" ub WHERE ub.""UserId"" = u.""Id"" AND ub.""BadgeId"" = @BadgeId)";

            case "expert":
            case "legend":
            case "custom_xp":
            default:
                return @"SELECT u.""Id"" FROM ""Users"" u LEFT JOIN ""UserStats"" s ON s.""UserId"" = u.""Id"" WHERE u.""Role"" = 0 AND @RequiredPoints > 0 AND (u.""NexPoints"" >= @RequiredPoints OR COALESCE(s.""TotalXp"", 0) >= @RequiredPoints) AND NOT EXISTS (SELECT 1 FROM ""UserBadges"" ub WHERE ub.""UserId"" = u.""Id"" AND ub.""BadgeId"" = @BadgeId)";
        }
    }

    private async Task<List<Guid>> ExecuteBadgeReportQueryAsync(Badge badge)
    {
        var sql = ResolveBadgeReportSql(badge);
        var userIds = new List<Guid>();

        var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync();
        }

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;

        var pBadgeId = cmd.CreateParameter();
        pBadgeId.ParameterName = "@BadgeId";
        pBadgeId.Value = badge.Id;
        cmd.Parameters.Add(pBadgeId);

        var pReqPoints = cmd.CreateParameter();
        pReqPoints.ParameterName = "@RequiredPoints";
        pReqPoints.Value = badge.RequiredPoints;
        cmd.Parameters.Add(pReqPoints);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            if (reader.IsDBNull(0))
                continue;

            var val = reader.GetValue(0);
            if (val is Guid g)
            {
                userIds.Add(g);
            }
            else if (Guid.TryParse(val.ToString(), out var parsedGuid))
            {
                userIds.Add(parsedGuid);
            }
        }

        return userIds;
    }

    private BadgeDto MapToDto(Badge badge)
    {
        return new BadgeDto
        {
            Id = badge.Id,
            Name = badge.Name,
            Description = badge.Description,
            IconUrl = badge.IconUrl,
            Rarity = badge.Rarity,
            RequiredPoints = badge.RequiredPoints,
            Criteria = ResolveBadgeReportSql(badge),
            IsActive = badge.IsActive,
            CreatedAt = badge.CreatedAt
        };
    }

    private UserBadgeDto MapToUserBadgeDto(UserBadge userBadge)
    {
        return new UserBadgeDto
        {
            Id = userBadge.Id,
            UserId = userBadge.UserId,
            BadgeId = userBadge.BadgeId,
            BadgeName = userBadge.Badge?.Name ?? string.Empty,
            BadgeDescription = userBadge.Badge?.Description ?? string.Empty,
            BadgeIconUrl = userBadge.Badge?.IconUrl ?? string.Empty,
            BadgeRarity = userBadge.Badge?.Rarity.ToString() ?? string.Empty,
            EarnedAt = userBadge.EarnedAt,
            IsDisplayed = userBadge.IsDisplayed
        };
    }
}
