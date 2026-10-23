using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NextStep.Application.DTOs.Auth;
using NextStep.Application.Interfaces.Services;
using NextStep.Infrastructure.Data;
using NextStep.Infrastructure.Data.Seeders;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly NextStepDbContext _context;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, NextStepDbContext context, ILogger<AuthController> logger)
    {
        _authService = authService;
        _context = context;
        _logger = logger;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex) when (ex.Message.Contains("doesn't exist", StringComparison.OrdinalIgnoreCase) ||
                                   ex.InnerException?.Message.Contains("doesn't exist", StringComparison.OrdinalIgnoreCase) == true)
        {
            try
            {
                await DbSeeder.SeedAsync(_context);
                var response = await _authService.RegisterAsync(request);
                return Ok(response);
            }
            catch (Exception retryEx)
            {
                _logger.LogError(retryEx, "Erro após auto-seed no registro de {Email}", request?.Email);
                return StatusCode(500, new { message = $"Erro interno ao registrar usuário: {retryEx.Message}" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao registrar usuário {Email}", request?.Email);
            return StatusCode(500, new { message = $"Erro interno ao registrar usuário: {ex.Message}" });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex) when (ex.Message.Contains("doesn't exist", StringComparison.OrdinalIgnoreCase) ||
                                   ex.InnerException?.Message.Contains("doesn't exist", StringComparison.OrdinalIgnoreCase) == true)
        {
            _logger.LogWarning("Tabela Users ausente no login. Executando DbSeeder.SeedAsync automaticamente...");
            try
            {
                await DbSeeder.SeedAsync(_context);
                var response = await _authService.LoginAsync(request);
                return Ok(response);
            }
            catch (UnauthorizedAccessException uex)
            {
                return Unauthorized(new { message = uex.Message });
            }
            catch (Exception retryEx)
            {
                _logger.LogError(retryEx, "Erro após auto-seed no login de {Email}", request?.Email);
                return StatusCode(500, new { message = $"Erro interno ao autenticar: {retryEx.Message}" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao autenticar usuário {Email}", request?.Email);
            return StatusCode(500, new { message = $"Erro interno ao autenticar: {ex.Message}" });
        }
    }
}
