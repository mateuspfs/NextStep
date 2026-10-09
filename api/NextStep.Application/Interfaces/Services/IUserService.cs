using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Application.DTOs.Auth;

namespace NextStep.Application.Interfaces.Services;

public interface IUserService
{
    Task<UserDto> CreateUserAsync(CreateUserRequest request);
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<UserDto?> GetUserByIdAsync(Guid id);
    Task<bool> DeleteUserAsync(Guid id);
}
