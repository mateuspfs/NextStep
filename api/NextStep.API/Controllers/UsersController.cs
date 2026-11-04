using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextStep.Application.DTOs.Auth;
using NextStep.Application.Interfaces.Services;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = await _userService.CreateUserAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin)
        {
            if (string.IsNullOrEmpty(currentUserId) || !Guid.TryParse(currentUserId, out var parsedId) || parsedId != id)
            {
                return Forbid();
            }
            // Non-admin cannot escalate role
            request.Role = null;
        }

        try
        {
            var updated = await _userService.UpdateUserAsync(id, request);
            if (updated == null) return NotFound();
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _userService.DeleteUserAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
