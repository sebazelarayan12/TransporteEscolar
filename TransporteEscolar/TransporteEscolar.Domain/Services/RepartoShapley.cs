namespace TransporteEscolar.Domain.Services;

/// <summary>Reparto de los kilómetros reales de un viaje entre las familias que lo componen.</summary>
/// <param name="DistanciaTotalMetros">Largo del recorrido óptimo con todas las paradas.</param>
/// <param name="MetrosPorParada">Metros asignados a cada parada, en el mismo orden que la matriz. Suma exactamente el total.</param>
/// <param name="EsExacto">
/// <c>true</c> si se usó el valor de Shapley exacto; <c>false</c> si el viaje superó
/// <see cref="RepartoShapley.MaxParadasExacto"/> y se repartió proporcionalmente.
/// </param>
public sealed record RepartoViaje(int DistanciaTotalMetros, IReadOnlyList<int> MetrosPorParada, bool EsExacto);

/// <summary>
/// Reparte los kilómetros de un recorrido entre las familias usando el valor de Shapley.
/// </summary>
/// <remarks>
/// El valor de Shapley es el aporte marginal de cada familia promediado sobre todos los
/// órdenes posibles de incorporación. A diferencia del aporte marginal simple, el reparto
/// suma exactamente los kilómetros reales del viaje y nunca da negativo.
/// <para>
/// El cálculo es exacto: Held-Karp resuelve el recorrido óptimo de TODOS los subconjuntos
/// en una sola pasada, y sobre esos valores se calcula Shapley. El costo es O(2^n · n²),
/// aceptable hasta <see cref="MaxParadasExacto"/> paradas. Por encima se reparte
/// proporcionalmente a la distancia directa de cada casa al colegio.
/// </para>
/// <para>
/// Toda la aritmética es en memoria: la única consulta externa es la matriz de distancias.
/// </para>
/// </remarks>
public static class RepartoShapley
{
    /// <summary>
    /// Máximo de paradas para las que se calcula el valor exacto.
    /// Con 18 la tabla ocupa unos 36 MB y tarda alrededor de un segundo.
    /// </summary>
    public const int MaxParadasExacto = 18;

    /// <summary>Reparte los metros del recorrido entre las paradas.</summary>
    /// <param name="matriz">
    /// Matriz cuadrada de <c>(cantidadParadas + 1)</c> filas. <c>matriz[i][j]</c> son los metros
    /// de <c>i</c> a <c>j</c>. Los índices <c>0..cantidadParadas-1</c> son las casas y el último
    /// índice es el colegio.
    /// </param>
    /// <param name="cantidadParadas">Cantidad de casas del viaje.</param>
    /// <returns>El reparto, o <c>null</c> si no existe un recorrido finito que una todos los puntos.</returns>
    /// <exception cref="ArgumentNullException">Si la matriz es null.</exception>
    /// <exception cref="ArgumentException">Si la matriz no tiene el tamaño esperado.</exception>
    /// <exception cref="ArgumentOutOfRangeException">Si la cantidad de paradas es negativa.</exception>
    public static RepartoViaje? Calcular(double[][] matriz, int cantidadParadas)
    {
        ArgumentNullException.ThrowIfNull(matriz);

        if (cantidadParadas < 0)
            throw new ArgumentOutOfRangeException(nameof(cantidadParadas), cantidadParadas, "La cantidad de paradas no puede ser negativa");

        var esperado = cantidadParadas + 1;
        if (matriz.Length != esperado || matriz.Any(fila => fila is null || fila.Length != esperado))
            throw new ArgumentException($"La matriz debe ser cuadrada de {esperado}x{esperado}", nameof(matriz));

        var destino = cantidadParadas;

        if (cantidadParadas == 0)
            return new RepartoViaje(0, Array.Empty<int>(), true);

        if (cantidadParadas == 1)
        {
            var directo = matriz[0][destino];
            if (!double.IsFinite(directo))
                return null;

            var metrosUnico = Redondear(directo);
            return new RepartoViaje(metrosUnico, new[] { metrosUnico }, true);
        }

        if (cantidadParadas > MaxParadasExacto)
            return RepartirProporcional(matriz, cantidadParadas);

        var n = cantidadParadas;
        var cantidadSubconjuntos = 1 << n;

        // Held-Karp: costoParcial[S, j] = recorrido mínimo que cubre el conjunto S y termina en j.
        var costoParcial = new double[cantidadSubconjuntos * n];
        Array.Fill(costoParcial, double.PositiveInfinity);

        for (var i = 0; i < n; i++)
        {
            costoParcial[(1 << i) * n + i] = 0;
        }

        for (var conjunto = 1; conjunto < cantidadSubconjuntos; conjunto++)
        {
            for (var ultima = 0; ultima < n; ultima++)
            {
                if ((conjunto & (1 << ultima)) == 0)
                    continue;

                var actual = costoParcial[conjunto * n + ultima];
                if (double.IsPositiveInfinity(actual))
                    continue;

                for (var siguiente = 0; siguiente < n; siguiente++)
                {
                    if ((conjunto & (1 << siguiente)) != 0)
                        continue;

                    var ampliado = conjunto | (1 << siguiente);
                    var costo = actual + matriz[ultima][siguiente];

                    if (costo < costoParcial[ampliado * n + siguiente])
                    {
                        costoParcial[ampliado * n + siguiente] = costo;
                    }
                }
            }
        }

        // costoOptimo[S] = recorrido mínimo que visita S y termina en el colegio.
        var costoOptimo = new double[cantidadSubconjuntos];
        for (var conjunto = 1; conjunto < cantidadSubconjuntos; conjunto++)
        {
            var mejor = double.PositiveInfinity;

            for (var ultima = 0; ultima < n; ultima++)
            {
                if ((conjunto & (1 << ultima)) == 0)
                    continue;

                var parcial = costoParcial[conjunto * n + ultima];
                if (double.IsPositiveInfinity(parcial))
                    continue;

                var completo = parcial + matriz[ultima][destino];
                if (completo < mejor)
                {
                    mejor = completo;
                }
            }

            costoOptimo[conjunto] = mejor;
        }

        costoOptimo[0] = 0;

        var total = costoOptimo[cantidadSubconjuntos - 1];
        if (!double.IsFinite(total))
            return null;

        // Peso de Shapley: s! · (n-s-1)! / n!, donde s es el tamaño del subconjunto previo.
        var factorial = new double[n + 1];
        factorial[0] = 1;
        for (var i = 1; i <= n; i++)
        {
            factorial[i] = factorial[i - 1] * i;
        }

        var peso = new double[n];
        for (var tamano = 0; tamano < n; tamano++)
        {
            peso[tamano] = factorial[tamano] * factorial[n - tamano - 1] / factorial[n];
        }

        var cantidadBits = new byte[cantidadSubconjuntos];
        for (var conjunto = 1; conjunto < cantidadSubconjuntos; conjunto++)
        {
            cantidadBits[conjunto] = (byte)(cantidadBits[conjunto >> 1] + (conjunto & 1));
        }

        var valorShapley = new double[n];
        for (var parada = 0; parada < n; parada++)
        {
            var bit = 1 << parada;

            for (var conjunto = 0; conjunto < cantidadSubconjuntos; conjunto++)
            {
                if ((conjunto & bit) != 0)
                    continue;

                valorShapley[parada] += peso[cantidadBits[conjunto]] * (costoOptimo[conjunto | bit] - costoOptimo[conjunto]);
            }
        }

        return Ajustar(total, valorShapley, esExacto: true);
    }

    /// <summary>
    /// Reparto de respaldo para viajes muy grandes: proporcional a la distancia directa
    /// de cada casa al colegio. Sigue sumando el total exacto.
    /// </summary>
    private static RepartoViaje? RepartirProporcional(double[][] matriz, int cantidadParadas)
    {
        var destino = cantidadParadas;
        var directas = new double[cantidadParadas];
        var suma = 0d;

        for (var i = 0; i < cantidadParadas; i++)
        {
            var directa = matriz[i][destino];
            if (!double.IsFinite(directa))
                return null;

            directas[i] = directa;
            suma += directa;
        }

        // Aproximación del recorrido total: el vecino más cercano alcanza para no subestimarlo groseramente.
        var total = AproximarRecorrido(matriz, cantidadParadas);
        if (!double.IsFinite(total))
            return null;

        var reparto = new double[cantidadParadas];
        for (var i = 0; i < cantidadParadas; i++)
        {
            reparto[i] = suma > 0 ? total * directas[i] / suma : total / cantidadParadas;
        }

        return Ajustar(total, reparto, esExacto: false);
    }

    /// <summary>Recorrido aproximado por vecino más cercano, terminando en el colegio.</summary>
    private static double AproximarRecorrido(double[][] matriz, int cantidadParadas)
    {
        var destino = cantidadParadas;
        var visitada = new bool[cantidadParadas];

        // Arranca en la parada más lejana al colegio, que es lo que suele hacer el recorrido real.
        var actual = 0;
        for (var i = 1; i < cantidadParadas; i++)
        {
            if (matriz[i][destino] > matriz[actual][destino])
            {
                actual = i;
            }
        }

        visitada[actual] = true;
        var total = 0d;

        for (var paso = 1; paso < cantidadParadas; paso++)
        {
            var mejor = -1;
            var mejorDistancia = double.PositiveInfinity;

            for (var candidata = 0; candidata < cantidadParadas; candidata++)
            {
                if (visitada[candidata])
                    continue;

                if (matriz[actual][candidata] < mejorDistancia)
                {
                    mejorDistancia = matriz[actual][candidata];
                    mejor = candidata;
                }
            }

            if (mejor < 0 || !double.IsFinite(mejorDistancia))
                return double.PositiveInfinity;

            total += mejorDistancia;
            visitada[mejor] = true;
            actual = mejor;
        }

        return total + matriz[actual][destino];
    }

    /// <summary>
    /// Redondea el reparto a metros enteros garantizando que la suma dé exactamente el total.
    /// El sobrante del redondeo se carga a la parada de mayor asignación.
    /// </summary>
    private static RepartoViaje Ajustar(double total, double[] reparto, bool esExacto)
    {
        var totalMetros = Redondear(total);
        var metros = new int[reparto.Length];
        var acumulado = 0;

        for (var i = 0; i < reparto.Length; i++)
        {
            metros[i] = Redondear(Math.Max(0, reparto[i]));
            acumulado += metros[i];
        }

        var sobrante = totalMetros - acumulado;
        if (sobrante != 0 && metros.Length > 0)
        {
            var mayor = 0;
            for (var i = 1; i < metros.Length; i++)
            {
                if (metros[i] > metros[mayor])
                {
                    mayor = i;
                }
            }

            metros[mayor] = Math.Max(0, metros[mayor] + sobrante);
        }

        return new RepartoViaje(totalMetros, metros, esExacto);
    }

    private static int Redondear(double valor) => (int)Math.Round(valor, MidpointRounding.AwayFromZero);
}
