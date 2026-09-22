namespace TransporteEscolar.Domain.Entities;

/// <summary>
/// Foto del recorrido completo de un horario en un vehículo: todas las paradas
/// más el colegio, con el reparto de kilómetros de cada titular (valor de Shapley).
/// </summary>
public class RecorridoHorario
{
    private readonly List<AporteReparto> _aportes = new();

    public int Id { get; private set; }

    public int HorarioId { get; private set; }

    /// <summary>Vehículo: 1 (Ducato) o 2 (Sprinter).</summary>
    public byte Transporte { get; private set; }

    /// <summary>Largo total del recorrido con todas las paradas, en metros.</summary>
    public int DistanciaTotalMetros { get; private set; }

    public int CantidadParadas { get; private set; }

    /// <summary>
    /// Metros de la última casa al colegio. Cero en los viajes de vuelta, donde el recorrido
    /// termina en una casa (ver la convención de tramos en la documentación de <see cref="AgregarAporte"/>).
    /// </summary>
    public int MetrosTramoFinal { get; private set; }

    /// <summary>Duración total estimada del recorrido, en segundos. Nunca negativo.</summary>
    public int DuracionTotalSegundos { get; private set; }

    public DateTime FechaCalculo { get; private set; }

    public IReadOnlyCollection<AporteReparto> Aportes => _aportes.AsReadOnly();

    /// <summary>Constructor para EF Core.</summary>
    private RecorridoHorario()
    {
    }

    /// <exception cref="ArgumentOutOfRangeException">Si algún valor es inválido.</exception>
    public RecorridoHorario(
        int horarioId,
        byte transporte,
        int distanciaTotalMetros,
        int cantidadParadas,
        int metrosTramoFinal,
        int duracionTotalSegundos)
    {
        if (horarioId <= 0)
            throw new ArgumentOutOfRangeException(nameof(horarioId), horarioId, "El id del horario debe ser mayor a cero");

        if (transporte is not (1 or 2))
            throw new ArgumentOutOfRangeException(nameof(transporte), transporte, "El transporte debe ser 1 o 2");

        ValidarMedidas(distanciaTotalMetros, cantidadParadas);

        if (metrosTramoFinal < 0)
            throw new ArgumentOutOfRangeException(nameof(metrosTramoFinal), metrosTramoFinal, "El tramo final no puede ser negativo");

        if (duracionTotalSegundos < 0)
            throw new ArgumentOutOfRangeException(nameof(duracionTotalSegundos), duracionTotalSegundos, "La duración no puede ser negativa");

        HorarioId = horarioId;
        Transporte = transporte;
        DistanciaTotalMetros = distanciaTotalMetros;
        CantidadParadas = cantidadParadas;
        MetrosTramoFinal = metrosTramoFinal;
        DuracionTotalSegundos = duracionTotalSegundos;
        FechaCalculo = DateTime.UtcNow;
    }

    /// <summary>Reemplaza los datos del snapshot y borra los aportes, que quedaron obsoletos.</summary>
    public void Reemplazar(int distanciaTotalMetros, int cantidadParadas)
    {
        ValidarMedidas(distanciaTotalMetros, cantidadParadas);

        DistanciaTotalMetros = distanciaTotalMetros;
        CantidadParadas = cantidadParadas;
        FechaCalculo = DateTime.UtcNow;
        _aportes.Clear();
    }

    /// <summary>
    /// Registra el reparto de kilómetros de un titular. Si ya existía uno para ese titular, lo reemplaza.
    /// El valor de Shapley nunca da negativo; el recorte a cero es una red de seguridad defensiva,
    /// no un caso esperado.
    /// </summary>
    /// <param name="orden">Posición de esta parada en el orden real de visita del viaje (1-based).</param>
    /// <param name="metrosTramoAnterior">
    /// Metros desde el punto anterior del recorrido hasta esta casa. Convención uniforme para los
    /// dos sentidos: en ida, el tramo de la primera parada es cero (ahí arranca el recorrido) y
    /// <see cref="MetrosTramoFinal"/> es la distancia de la última casa al colegio; en vuelta, el
    /// tramo de la primera parada es la distancia desde el colegio y <see cref="MetrosTramoFinal"/>
    /// es cero (el recorrido termina en una casa).
    /// </param>
    public void AgregarAporte(int titularId, int metrosAsignados, int orden, int metrosTramoAnterior)
    {
        var existente = _aportes.FirstOrDefault(a => a.TitularId == titularId);

        if (existente is not null)
        {
            existente.ActualizarMetros(metrosAsignados, orden, metrosTramoAnterior);
            return;
        }

        _aportes.Add(new AporteReparto(titularId, metrosAsignados, orden, metrosTramoAnterior));
    }

    private static void ValidarMedidas(int distanciaTotalMetros, int cantidadParadas)
    {
        if (distanciaTotalMetros < 0)
            throw new ArgumentOutOfRangeException(nameof(distanciaTotalMetros), distanciaTotalMetros, "La distancia no puede ser negativa");

        if (cantidadParadas < 0)
            throw new ArgumentOutOfRangeException(nameof(cantidadParadas), cantidadParadas, "La cantidad de paradas no puede ser negativa");
    }
}
