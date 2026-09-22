using FluentAssertions;
using TransporteEscolar.Domain.Services;

namespace TransporteEscolar.Tests.Domain;

public class RepartoShapleyTests
{
    /// <summary>
    /// Arma una matriz de distancias euclídeas a partir de puntos en una recta.
    /// El último punto es el destino (colegio).
    /// </summary>
    private static double[][] MatrizEnRecta(params double[] posiciones)
    {
        var n = posiciones.Length;
        var matriz = new double[n][];
        for (var i = 0; i < n; i++)
        {
            matriz[i] = new double[n];
            for (var j = 0; j < n; j++)
            {
                matriz[i][j] = Math.Abs(posiciones[i] - posiciones[j]);
            }
        }

        return matriz;
    }

    [Fact]
    public void Calcular_SinParadas_DevuelveRepartoVacio()
    {
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(0), 0, 0, ExtremoFijo.Primera);

        resultado.Should().NotBeNull();
        resultado!.DistanciaTotalMetros.Should().Be(0);
        resultado.MetrosPorParada.Should().BeEmpty();
    }

    [Fact]
    public void Calcular_ConUnaSolaParada_LeAsignaTodoElRecorrido()
    {
        // parada en 10, colegio en 0
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(10, 0), 1, 0, ExtremoFijo.Primera);

        resultado!.DistanciaTotalMetros.Should().Be(10);
        resultado.MetrosPorParada.Should().Equal(10);
    }

    [Fact]
    public void Calcular_ConDosParadasSimetricas_RepartePorIgual()
    {
        // Triángulo equilátero de lado 10: A y B a 10 del colegio y a 10 entre sí.
        // Recorrido óptimo = 20. Por simetría le toca 10 a cada una.
        var matriz = new[]
        {
            new[] { 0d, 10d, 10d },
            new[] { 10d, 0d, 10d },
            new[] { 10d, 10d, 0d }
        };

        var resultado = RepartoShapley.Calcular(matriz, 2, 0, ExtremoFijo.Primera);

        resultado!.DistanciaTotalMetros.Should().Be(20);
        resultado.MetrosPorParada.Should().Equal(10, 10);
    }

    [Fact]
    public void Calcular_LaFamiliaQueQuedaDePaso_PagaMenosQueSuDistanciaDirecta()
    {
        // Colegio en 0, B en 5, A en 10: B está justo sobre el camino de A.
        // Recorrido óptimo A->B->colegio = 10.
        // Shapley exacto: A = 7,5 ; B = 2,5 (verificado a mano).
        // Parada fija 0 (A): coincide con el óptimo libre, así que el reparto no cambia.
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(10, 5, 0), 2, 0, ExtremoFijo.Primera);

        resultado!.DistanciaTotalMetros.Should().Be(10);
        // El valor real es 7,5 y 2,5. Ambos redondean a "el par más cercano" (MidpointRounding.AwayFromZero
        // por elemento) y el ajuste del sobrante recae sobre la parada de mayor asignación (A), no B:
        // 7,5 -> 8 y 2,5 -> 3 suman 11, un metro de más, que se descuenta de la mayor (A: 8 -> 7).
        resultado.MetrosPorParada[0].Should().Be(7);  // 7,5 redondeado a 8, ajustado -1 para que sume 10
        resultado.MetrosPorParada[1].Should().Be(3);  // 2,5 redondeado a 3

        // B vive a 5 del colegio pero aporta menos, porque queda de paso.
        resultado.MetrosPorParada[1].Should().BeLessThan(5);
    }

    [Fact]
    public void Calcular_LaSumaSiempreEsIgualAlTotal()
    {
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(12, 7, 3, 20, 15, 0), 5, 0, ExtremoFijo.Primera);

        resultado!.MetrosPorParada.Sum().Should().Be(resultado.DistanciaTotalMetros);
    }

    [Fact]
    public void Calcular_NuncaDevuelveValoresNegativos()
    {
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(12, 7, 3, 20, 15, 0), 5, 0, ExtremoFijo.Primera);

        resultado!.MetrosPorParada.Should().OnlyContain(m => m >= 0);
    }

    [Fact]
    public void Calcular_DentroDelUmbral_MarcaElResultadoComoExacto()
    {
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(10, 5, 0), 2, 0, ExtremoFijo.Primera);

        resultado!.EsExacto.Should().BeTrue();
    }

    [Fact]
    public void Calcular_PorEncimaDelUmbral_UsaElRepartoProporcionalYLoMarcaComoAproximado()
    {
        var cantidad = RepartoShapley.MaxParadasExacto + 1;
        var posiciones = new double[cantidad + 1];
        for (var i = 0; i < cantidad; i++)
        {
            posiciones[i] = (i + 1) * 100;
        }
        posiciones[cantidad] = 0;

        var resultado = RepartoShapley.Calcular(MatrizEnRecta(posiciones), cantidad, 0, ExtremoFijo.Primera);

        resultado!.EsExacto.Should().BeFalse();
        resultado.MetrosPorParada.Sum().Should().Be(resultado.DistanciaTotalMetros);
        resultado.MetrosPorParada.Should().OnlyContain(m => m >= 0);
        resultado.Orden.Should().HaveCount(cantidad);
        resultado.Orden.Distinct().Should().HaveCount(cantidad);
        resultado.Orden[0].Should().Be(0);
    }

    [Fact]
    public void Calcular_ConDistanciasInalcanzables_DevuelveNull()
    {
        var matriz = new[]
        {
            new[] { 0d, double.PositiveInfinity },
            new[] { double.PositiveInfinity, 0d }
        };

        RepartoShapley.Calcular(matriz, 1, 0, ExtremoFijo.Primera).Should().BeNull();
    }

    [Fact]
    public void Calcular_ConMatrizDeTamanoIncorrecto_Lanza()
    {
        var accion = () => RepartoShapley.Calcular(MatrizEnRecta(10, 0), 5, 0, ExtremoFijo.Primera);

        accion.Should().Throw<ArgumentException>();
    }

    // Recta: parada 0 en x=10, parada 1 en x=5, colegio en x=0.

    [Fact]
    public void Calcular_Ida_ConLaPrimeraParadaQueYaEraOptima_NoCambiaElReparto()
    {
        // Forzar arrancar por la parada 0 coincide con el óptimo libre: 10 -> 5 -> colegio = 10.
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(10, 5, 0), 2, 0, ExtremoFijo.Primera);

        resultado!.DistanciaTotalMetros.Should().Be(10);
        resultado.Orden.Should().Equal(0, 1);
        resultado.MetrosPorParada.Sum().Should().Be(10);
    }

    [Fact]
    public void Calcular_Ida_ForzarUnaPrimeraParadaPeor_EncareceElRecorridoYTodosPaganMas()
    {
        // Forzando arrancar por la parada 1: 5 -> 10 -> colegio = 15 (contra 10 del óptimo libre).
        // Shapley exacto: parada 0 = 10 ; parada 1 = 5.
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(10, 5, 0), 2, 1, ExtremoFijo.Primera);

        resultado!.DistanciaTotalMetros.Should().Be(15);
        resultado.Orden.Should().Equal(1, 0);
        resultado.MetrosPorParada[0].Should().Be(10);
        resultado.MetrosPorParada[1].Should().Be(5);
        resultado.MetrosPorParada.Sum().Should().Be(15);
    }

    [Fact]
    public void Calcular_Vuelta_TerminaEnLaParadaFija()
    {
        // colegio -> 5 -> 10 = 10. Shapley: parada 0 = 7,5 ; parada 1 = 2,5.
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(10, 5, 0), 2, 0, ExtremoFijo.Ultima);

        resultado!.DistanciaTotalMetros.Should().Be(10);
        resultado.Orden.Should().Equal(1, 0);
        resultado.Orden.Last().Should().Be(0);
        resultado.MetrosPorParada.Sum().Should().Be(10);
    }

    [Fact]
    public void Calcular_ElOrdenContieneTodasLasParadasUnaSolaVez()
    {
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(12, 7, 3, 20, 15, 0), 5, 2, ExtremoFijo.Primera);

        resultado!.Orden.Should().HaveCount(5);
        resultado.Orden.Distinct().Should().HaveCount(5);
        resultado.Orden.Should().OnlyContain(i => i >= 0 && i < 5);
        resultado.Orden[0].Should().Be(2);
    }

    [Fact]
    public void Calcular_ConCincoParadas_LaSumaSigueSiendoElTotal()
    {
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(12, 7, 3, 20, 15, 0), 5, 3, ExtremoFijo.Primera);

        resultado!.MetrosPorParada.Sum().Should().Be(resultado.DistanciaTotalMetros);
        resultado.MetrosPorParada.Should().OnlyContain(m => m >= 0);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(2)]
    public void Calcular_ConParadaFijaFueraDeRango_Lanza(int paradaFija)
    {
        var accion = () => RepartoShapley.Calcular(MatrizEnRecta(10, 5, 0), 2, paradaFija, ExtremoFijo.Primera);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("paradaFija");
    }
}
