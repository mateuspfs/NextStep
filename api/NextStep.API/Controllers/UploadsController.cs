using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextStep.Application.Interfaces.Services;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private readonly IMediaService _mediaService;
    private readonly ILogger<UploadsController> _logger;

    public UploadsController(IMediaService mediaService, ILogger<UploadsController> logger)
    {
        _mediaService = mediaService;
        _logger = logger;
    }

    /// <summary>
    /// Faz upload de uma imagem para o AWS S3 (ou fallback local).
    /// Suporta chamadas padrão (campo 'file') e CKEditor (campo 'upload').
    /// </summary>
    [HttpPost("image")]
    [HttpPost]
    public async Task<IActionResult> UploadImage(
        [FromForm] IFormFile? file,
        [FromForm(Name = "upload")] IFormFile? upload,
        CancellationToken cancellationToken)
    {
        var targetFile = file ?? upload;

        if (targetFile == null || targetFile.Length == 0)
        {
            return BadRequest(new { message = "Nenhum arquivo de imagem foi enviado." });
        }

        const long maxSizeBytes = 10 * 1024 * 1024; // 10MB
        if (targetFile.Length > maxSizeBytes)
        {
            return BadRequest(new { message = "A imagem excede o tamanho máximo permitido de 10MB." });
        }

        var allowedMimeTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml"
        };

        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"
        };

        var extension = Path.GetExtension(targetFile.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension) && !allowedMimeTypes.Contains(targetFile.ContentType))
        {
            return BadRequest(new { message = "Tipo de arquivo inválido. Formatos permitidos: JPG, PNG, WEBP, GIF, SVG." });
        }

        try
        {
            using var stream = targetFile.OpenReadStream();
            var url = await _mediaService.UploadImageAsync(
                stream,
                targetFile.FileName,
                targetFile.ContentType,
                cancellationToken);

            // Retorna formato compatível com o frontend NextStep e com o CKEditor
            return Ok(new
            {
                url,
                defaultUrl = url,
                uploaded = true,
                urls = new { @default = url }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao realizar upload de imagem.");
            return StatusCode(500, new { message = "Falha ao processar o upload da imagem." });
        }
    }
}
