using System.Net;
using System.Text.Json;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Api.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ocurrió una excepción no controlada: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            NotFoundException notFoundEx => new ErrorResponse
            {
                Type = "NotFound",
                Message = notFoundEx.Message,
                StackTrace = _environment.IsDevelopment() ? notFoundEx.StackTrace : null
            },
            ValidationException validationEx => new ErrorResponse
            {
                Type = "ValidationError",
                Message = validationEx.Message,
                Errors = validationEx.Errors,
                StackTrace = _environment.IsDevelopment() ? validationEx.StackTrace : null
            },
            BusinessRuleException businessEx => new ErrorResponse
            {
                Type = "BusinessRuleViolation",
                Message = businessEx.Message,
                StackTrace = _environment.IsDevelopment() ? businessEx.StackTrace : null
            },
            ArgumentException argEx => new ErrorResponse
            {
                Type = "InvalidArgument",
                Message = argEx.Message,
                StackTrace = _environment.IsDevelopment() ? argEx.StackTrace : null
            },
            _ => new ErrorResponse
            {
                Type = "InternalServerError",
                Message = _environment.IsDevelopment() 
                    ? exception.Message 
                    : "Ocurrió un error interno en el servidor",
                StackTrace = _environment.IsDevelopment() ? exception.StackTrace : null
            }
        };

        context.Response.StatusCode = exception switch
        {
            NotFoundException => (int)HttpStatusCode.NotFound,
            ValidationException => (int)HttpStatusCode.BadRequest,
            BusinessRuleException => (int)HttpStatusCode.BadRequest,
            ArgumentException => (int)HttpStatusCode.BadRequest,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = _environment.IsDevelopment()
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
