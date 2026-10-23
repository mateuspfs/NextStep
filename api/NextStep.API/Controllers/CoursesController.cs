using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextStep.Application.DTOs.Courses;
using NextStep.Application.Interfaces.Services;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<CourseDto>>> GetAll()
    {
        var courses = await _courseService.GetAllAsync();
        return Ok(courses);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<CourseDto>> GetById(Guid id)
    {
        var course = await _courseService.GetByIdAsync(id);
        if (course == null) return NotFound();
        return Ok(course);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CourseDto>> Create([FromBody] CreateCourseRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var course = await _courseService.CreateAsync(request, Guid.Parse(userId));
        return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
    }

    [HttpPost("{id:guid}/enroll")]
    public async Task<IActionResult> Enroll(Guid id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _courseService.EnrollUserAsync(Guid.Parse(userId), id);
        if (!result) return BadRequest(new { message = "Already enrolled or course not found" });

        return Ok(new { message = "Enrolled successfully" });
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<IEnumerable<UserCourseDto>>> GetUserCourses(Guid userId)
    {
        var courses = await _courseService.GetUserCoursesAsync(userId);
        return Ok(courses);
    }

    [HttpGet("user/{userId:guid}/course/{courseId:guid}")]
    public async Task<ActionResult<UserCourseDto>> GetUserCourse(Guid userId, Guid courseId)
    {
        var userCourse = await _courseService.GetUserCourseAsync(userId, courseId);
        if (userCourse == null) return NotFound();
        return Ok(userCourse);
    }

    [HttpPost("user/{userId:guid}/course/{courseId:guid}/complete-lesson/{lessonId:guid}")]
    public async Task<IActionResult> CompleteLesson(Guid userId, Guid courseId, Guid lessonId)
    {
        var result = await _courseService.CompleteLessonAsync(userId, courseId, lessonId);
        if (!result) return BadRequest(new { message = "Failed to complete lesson" });

        return Ok(new { message = "Lesson completed successfully" });
    }

    [HttpPost("{courseId:guid}/advance")]
    public async Task<IActionResult> AdvanceLesson(Guid courseId)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var parsedUserId = Guid.Parse(userId);
        var existing = await _courseService.GetUserCourseAsync(parsedUserId, courseId);
        if (existing == null)
        {
            await _courseService.EnrollUserAsync(parsedUserId, courseId);
        }

        var result = await _courseService.CompleteLessonAsync(parsedUserId, courseId, Guid.NewGuid());
        if (!result) return BadRequest(new { message = "Não foi possível avançar no treinamento." });

        var updated = await _courseService.GetUserCourseAsync(parsedUserId, courseId);
        return Ok(updated);
    }
}
