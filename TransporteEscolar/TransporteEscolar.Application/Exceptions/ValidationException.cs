namespace TransporteEscolar.Application.Exceptions;

public class ValidationException : Exception
{
    public ValidationException(string message) : base(message)
    {
    }

    public ValidationException(string message, Dictionary<string, string[]> errors) 
        : base(message)
    {
        Errors = errors;
    }

    public Dictionary<string, string[]>? Errors { get; }
}
