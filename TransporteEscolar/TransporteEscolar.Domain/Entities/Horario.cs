using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Domain.Entities;

public class Horario
{
    public int Id { get; private set; }
    public string Etiqueta { get; private set; } = null!;
    public int Orden { get; private set; }

    /// <summary>
    /// Colegio de destino de este horario. Nullable porque los horarios existen desde antes
    /// que la tabla de colegios, y puede aparecer un horario que no corresponda a un colegio.
    /// </summary>
    public int? ColegioId { get; private set; }

    /// <summary>Navegación al colegio de destino.</summary>
    public Colegio? Colegio { get; private set; }

    /// <summary>Dirección del recorrido: de las casas al colegio, o del colegio a las casas.</summary>
    public SentidoHorario Sentido { get; private set; }

    /// <summary>
    /// Si es false el horario está dado de baja: no se lista por defecto, no admite pasajeros nuevos y no entra
    /// en los cálculos de recorridos. Nunca se borra: reactivarlo lo deja como estaba.
    /// </summary>
    public bool Activo { get; private set; } = true;

    public ICollection<PasajeroHorario> PasajeroHorarios { get; private set; }

    private Horario()
    {
        PasajeroHorarios = new List<PasajeroHorario>();
    }

    public Horario(string etiqueta, int orden)
    {
        if (string.IsNullOrWhiteSpace(etiqueta))
            throw new ArgumentException("La etiqueta es obligatoria", nameof(etiqueta));

        Etiqueta = etiqueta.Trim();
        Orden = orden;
        Sentido = SentidoHorario.Ida;
        PasajeroHorarios = new List<PasajeroHorario>();
    }

    public void ActualizarEtiqueta(string etiqueta)
    {
        if (string.IsNullOrWhiteSpace(etiqueta))
            throw new ArgumentException("La etiqueta es obligatoria", nameof(etiqueta));

        Etiqueta = etiqueta.Trim();
    }

    public void ActualizarOrden(int orden)
    {
        Orden = orden;
    }

    /// <summary>Vincula el horario con un colegio, o lo desvincula si se pasa null.</summary>
    /// <param name="colegioId">Id del colegio, o null para desvincular.</param>
    /// <exception cref="ArgumentOutOfRangeException">Si el id no es null y es menor o igual a cero.</exception>
    public void AsignarColegio(int? colegioId)
    {
        if (colegioId.HasValue && colegioId.Value <= 0)
            throw new ArgumentOutOfRangeException(nameof(colegioId), colegioId, "El id del colegio debe ser mayor a cero");

        ColegioId = colegioId;
    }

    /// <summary>Cambia el sentido del recorrido de este horario.</summary>
    public void AsignarSentido(SentidoHorario sentido)
    {
        Sentido = sentido;
    }

    /// <summary>Crea un horario completo (etiqueta, orden, colegio de destino y sentido).</summary>
    /// <exception cref="ArgumentException">Si la etiqueta está vacía.</exception>
    /// <exception cref="ArgumentOutOfRangeException">Si el colegio es menor o igual a cero o el sentido no existe.</exception>
    public static Horario Crear(string etiqueta, int orden, int colegioId, SentidoHorario sentido)
    {
        if (!Enum.IsDefined(sentido))
            throw new ArgumentOutOfRangeException(nameof(sentido), sentido, "El sentido no es válido");

        var horario = new Horario(etiqueta, orden);
        horario.AsignarColegio(colegioId);
        horario.AsignarSentido(sentido);
        return horario;
    }

    /// <summary>Da de baja el horario (baja lógica). No toca ninguna otra información.</summary>
    public void Desactivar() => Activo = false;

    /// <summary>Vuelve a activar un horario dado de baja.</summary>
    public void Reactivar() => Activo = true;
}
