namespace TransporteEscolar.Api.Middleware;

public class ErrorResponse
{
    public string Type { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string? StackTrace { get; set; }
    public Dictionary<string, string[]>? Errors { get; set; }
}
