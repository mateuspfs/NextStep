using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Application.DTOs.Badges;

namespace NextStep.Application.Interfaces.Services;

public interface IBadgeService
{
    Task<IEnumerable<BadgeDto>> GetAllAsync();
    Task<IEnumerable<UserBadgeDto>> GetUserBadgesAsync(Guid userId);
    Task<bool> AwardBadgeAsync(Guid userId, Guid badgeId);
    Task<bool> CheckAndAwardBadgesAsync(Guid userId);
}
