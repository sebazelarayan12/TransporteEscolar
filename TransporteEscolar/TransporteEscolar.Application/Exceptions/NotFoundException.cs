namespace TransporteEscolar.Application.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string entityName, int id)
        : base($"{entityName} con ID {id} no fue encontrado")
    {
        EntityName = entityName;
        EntityId = id;
    }

    public string EntityName { get; }
    public int EntityId { get; }
}
