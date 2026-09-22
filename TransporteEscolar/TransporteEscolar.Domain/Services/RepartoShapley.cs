namespace TransporteEscolar.Domain.Services;

/// <summary>Cuál extremo del recorrido queda fijado por la parada elegida a mano.</summary>
public enum ExtremoFijo
{
    /// <summary>Horarios de ida: el recorrido arranca en esa casa y termina en el colegio.</summary>
    Primera = 1,

    /// <summary>Horarios de vuelta: el recorrido arranca en el colegio y termina en esa casa.</summary>
    Ultima = 2
}

/// <summary>Reparto de los kilómetros reales de un viaje entre las familias que lo componen.</summary>
/// <param name="DistanciaTotalMetros">Largo del recorrido óptimo con todas las paradas.</param>
/// <param name="MetrosPorParada">Metros asignados a cada parada, en el mismo orden que la matriz. Suma exactamente el total.</param>
/// <param name="Orden">Índices de parada en el orden real de visita del recorrido. En ida empieza por la parada fija; en vuelta termina en ella.</param>
/// <param name="EsExacto">
/// <c>true</c> si se usó el valor de Shapley exacto; <c>false</c> si el viaje superó
/// <see cref="RepartoShapley.MaxParadasExacto"/> y se repartió proporcionalmente.
/// </param>
public sealed record RepartoViaje(
    int DistanciaTotalMetros,
    IReadOnlyList<int> MetrosPorParada,
    IReadOnlyList<int> Orden,
    bool EsExacto);

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
/// El recorrido tiene un extremo fijo: en ida, la primera casa; en vuelta, la última.
/// Los subconjuntos que no contienen esa casa no tienen la restricción, así que quedan
/// con arranque libre (que es lo correcto: si la casa fija no está, la restricción no aplica).
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
    /// <param name="paradaFija">Índice de la casa elegida a mano como extremo fijo del recorrido.</param>
    /// <param name="extremo">Qué extremo del recorrido queda fijado por <paramref name="paradaFija"/>.</param>
    /// <returns>El reparto, o <c>null</c> si no existe un recorrido finito que una todos los puntos.</returns>
    /// <exception cref="ArgumentNullException">Si la matriz es null.</exception>
    /// <exception cref="ArgumentException">Si la matriz no tiene el tamaño esperado.</exception>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Si la cantidad de paradas es negativa, o si <paramref name="paradaFija"/> no es un índice
    /// válido dentro de la cantidad de paradas (cuando hay al menos una).
    /// </exception>
    public static RepartoViaje? Calcular(double[][] matriz, int cantidadParadas, int paradaFija, ExtremoFijo extremo)
    {
        ArgumentNullException.ThrowIfNull(matriz);

        if (cantidadParadas < 0)
            throw new ArgumentOutOfRangeException(nameof(cantidadParadas), cantidadParadas, "La cantidad de paradas no puede ser negativa");

        var esperado = cantidadParadas + 1;
        if (matriz.Length != esperado || matriz.Any(fila => fila is null || fila.Length != esperado))
            throw new ArgumentException($"La matriz debe ser cuadrada de {esperado}x{esperado}", nameof(matriz));

        if (cantidadParadas > 0 && (paradaFija < 0 || paradaFija >= cantidadParadas))
            throw new ArgumentOutOfRangeException(nameof(paradaFija), paradaFija, "La parada fija debe ser un índice válido dentro de la cantidad de paradas");

        var destino = cantidadParadas;

        if (cantidadParadas == 0)
            return new RepartoViaje(0, Array.Empty<int>(), Array.Empty<int>(), true);

        if (cantidadParadas == 1)
        {
            var directo = matriz[0][destino];
            if (!double.IsFinite(directo))
                return null;

            var metrosUnico = Redondear(directo);
            return new RepartoViaje(metrosUnico, new[] { metrosUnico }, new[] { 0 }, true);
        }

        if (cantidadParadas > MaxParadasExacto)
            return RepartirProporcional(matriz, cantidadParadas, paradaFija, extremo);

        var n = cantidadParadas;
        var cantidadSubconjuntos = 1 << n;

        // Held-Karp: costoParcial[S, j] = recorrido mínimo que cubre el conjunto S y termina en j,
        // respetando el extremo fijo.
        var costoParcial = new double[cantidadSubconjuntos * n];
        Array.Fill(costoParcial, double.PositiveInfinity);

        // Siembra: depende del sentido del viaje.
        for (var i = 0; i < n; i++)
        {
            costoParcial[(1 << i) * n + i] = extremo == ExtremoFijo.Primera
                ? 0                        // ida: cualquier casa puede arrancar, salvo por la guarda de abajo
                : matriz[destino][i];      // vuelta: el recorrido siempre sale del colegio
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

                    // En ida, la parada fija solo puede ser el principio del recorrido:
                    // nunca se la agrega en el medio.
                    if (extremo == ExtremoFijo.Primera && siguiente == paradaFija)
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

        // v(S): en ida termina en el colegio; en vuelta termina en la parada fija si está en S.
        var costoOptimo = new double[cantidadSubconjuntos];
        for (var conjunto = 1; conjunto < cantidadSubconjuntos; conjunto++)
        {
            if (extremo == ExtremoFijo.Ultima && (conjunto & (1 << paradaFija)) != 0)
            {
                costoOptimo[conjunto] = costoParcial[conjunto * n + paradaFija];
                continue;
            }

            var mejor = double.PositiveInfinity;
            for (var ultima = 0; ultima < n; ultima++)
            {
                if ((conjunto & (1 << ultima)) == 0)
                    continue;

                var parcial = costoParcial[conjunto * n + ultima];
                if (double.IsPositiveInfinity(parcial))
                    continue;

                var completo = extremo == ExtremoFijo.Primera
                    ? parcial + matriz[ultima][destino]
                    : parcial;

                if (completo < mejor)
                    mejor = completo;
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

        var orden = ReconstruirOrden(costoParcial, matriz, n, destino, paradaFija, extremo);

        return Ajustar(total, valorShapley, orden, esExacto: true);
    }

    /// <summary>
    /// Reconstruye el orden de visita caminando el DP hacia atrás desde el estado final.
    /// </summary>
    private static int[] ReconstruirOrden(
        double[] costoParcial,
        double[][] matriz,
        int n,
        int destino,
        int paradaFija,
        ExtremoFijo extremo)
    {
        const double Tolerancia = 1e-6;
        var completo = (1 << n) - 1;

        int ultima;
        if (extremo == ExtremoFijo.Ultima)
        {
            ultima = paradaFija;
        }
        else
        {
            ultima = -1;
            var mejor = double.PositiveInfinity;
            for (var j = 0; j < n; j++)
            {
                var parcial = costoParcial[completo * n + j];
                if (double.IsPositiveInfinity(parcial))
                    continue;

                var total = parcial + matriz[j][destino];
                if (total < mejor)
                {
                    mejor = total;
                    ultima = j;
                }
            }
        }

        var orden = new List<int>(n);
        var conjunto = completo;

        while (ultima >= 0)
        {
            orden.Add(ultima);

            if (conjunto == (1 << ultima))
                break;

            var previo = conjunto & ~(1 << ultima);
            var anterior = -1;
            var menorDiferencia = double.PositiveInfinity;

            for (var i = 0; i < n; i++)
            {
                if ((previo & (1 << i)) == 0)
                    continue;

                var parcial = costoParcial[previo * n + i];
                if (double.IsPositiveInfinity(parcial))
                    continue;

                var diferencia = Math.Abs(parcial + matriz[i][ultima] - costoParcial[conjunto * n + ultima]);
                if (diferencia < menorDiferencia)
                {
                    menorDiferencia = diferencia;
                    anterior = i;
                }
            }

            if (anterior < 0 || menorDiferencia > Tolerancia)
                break;

            conjunto = previo;
            ultima = anterior;
        }

        orden.Reverse();
        return orden.ToArray();
    }

    /// <summary>
    /// Reparto de respaldo para viajes muy grandes: proporcional a la distancia directa
    /// de cada casa al colegio. Sigue sumando el total exacto.
    /// </summary>
    private static RepartoViaje? RepartirProporcional(double[][] matriz, int cantidadParadas, int paradaFija, ExtremoFijo extremo)
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
        var (total, secuencia) = AproximarRecorrido(matriz, cantidadParadas, paradaFija, extremo);
        if (!double.IsFinite(total))
            return null;

        var reparto = new double[cantidadParadas];
        for (var i = 0; i < cantidadParadas; i++)
        {
            reparto[i] = suma > 0 ? total * directas[i] / suma : total / cantidadParadas;
        }

        return Ajustar(total, reparto, secuencia, esExacto: false);
    }

    /// <summary>
    /// Recorrido aproximado por vecino más cercano, respetando el extremo fijo: arranca en la
    /// parada fija si es ida, y la reserva para el final si es vuelta.
    /// </summary>
    private static (double Total, int[] Orden) AproximarRecorrido(
        double[][] matriz, int cantidadParadas, int paradaFija, ExtremoFijo extremo)
    {
        var destino = cantidadParadas;
        var visitada = new bool[cantidadParadas];
        var secuencia = new int[cantidadParadas];

        int actual;
        if (extremo == ExtremoFijo.Primera)
        {
            actual = paradaFija;
        }
        else
        {
            // Vuelta: arranca en la parada más lejana al colegio (la misma heurística de siempre),
            // salvo que coincida con la parada fija, reservada para el final.
            actual = -1;
            for (var i = 0; i < cantidadParadas; i++)
            {
                if (i == paradaFija && cantidadParadas > 1)
                    continue;

                if (actual < 0 || matriz[i][destino] > matriz[actual][destino])
                {
                    actual = i;
                }
            }

            if (actual < 0)
                actual = paradaFija;
        }

        visitada[actual] = true;
        secuencia[0] = actual;

        // Vuelta: el recorrido arranca en el colegio, así que la primera pata es colegio -> primera parada.
        var total = extremo == ExtremoFijo.Ultima ? matriz[destino][actual] : 0d;

        for (var paso = 1; paso < cantidadParadas; paso++)
        {
            var esUltimoPaso = paso == cantidadParadas - 1;
            var mejor = -1;
            var mejorDistancia = double.PositiveInfinity;

            for (var candidata = 0; candidata < cantidadParadas; candidata++)
            {
                if (visitada[candidata])
                    continue;

                // Vuelta: la parada fija se reserva para el final del recorrido.
                if (extremo == ExtremoFijo.Ultima && candidata == paradaFija && !esUltimoPaso)
                    continue;

                if (matriz[actual][candidata] < mejorDistancia)
                {
                    mejorDistancia = matriz[actual][candidata];
                    mejor = candidata;
                }
            }

            if (mejor < 0 || !double.IsFinite(mejorDistancia))
                return (double.PositiveInfinity, secuencia);

            total += mejorDistancia;
            visitada[mejor] = true;
            secuencia[paso] = mejor;
            actual = mejor;
        }

        // Ida: el recorrido termina en el colegio. En vuelta ya terminó en la parada fija.
        if (extremo == ExtremoFijo.Primera)
            total += matriz[actual][destino];

        return (total, secuencia);
    }

    /// <summary>
    /// Redondea el reparto a metros enteros garantizando que la suma dé exactamente el total.
    /// El sobrante del redondeo se carga a la parada de mayor asignación.
    /// </summary>
    private static RepartoViaje Ajustar(double total, double[] reparto, int[] orden, bool esExacto)
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

        return new RepartoViaje(totalMetros, metros, orden, esExacto);
    }

    private static int Redondear(double valor) => (int)Math.Round(valor, MidpointRounding.AwayFromZero);
}
