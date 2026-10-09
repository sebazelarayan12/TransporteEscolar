using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Domain.Services;

/// <summary>Una cuota tocada por el reparto: saldo antes, monto aplicado y saldo que queda.</summary>
public sealed record ItemReparto(PagoMensual Pago, decimal SaldoAntes, decimal Aplicado)
{
    public decimal SaldoDespues => SaldoAntes - Aplicado;
}

/// <summary>Resultado del reparto: cuotas tocadas en orden y el monto que sobró sin poder aplicarse.</summary>
public sealed record ResultadoReparto(IReadOnlyList<ItemReparto> Items, decimal Sobrante);

/// <summary>
/// Reparto de un pago entre las cuotas pendientes de un titular, de la más vieja a la más nueva (año y mes
/// ascendente), aplicando a cada una el mínimo entre lo que queda y su saldo. Función PURA: no modifica nada.
/// Es la única implementación del reparto: la usan el registro real y la simulación.
/// </summary>
public static class ReparticionPagos
{
    public static ResultadoReparto Planificar(decimal monto, IEnumerable<PagoMensual> pagos)
    {
        if (monto <= 0)
            throw new ArgumentOutOfRangeException(nameof(monto), "El monto pagado debe ser mayor a 0");

        var pendientes = pagos
            .Where(p => p.SaldoPendiente() > 0)
            .OrderBy(p => p.Anio)
            .ThenBy(p => p.Mes)
            .ToList();

        var items = new List<ItemReparto>();
        var restante = monto;

        foreach (var pago in pendientes)
        {
            if (restante <= 0)
                break;

            var saldo = pago.SaldoPendiente();
            var aplicar = Math.Min(restante, saldo);
            items.Add(new ItemReparto(pago, saldo, aplicar));
            restante -= aplicar;
        }

        return new ResultadoReparto(items, restante);
    }
}
