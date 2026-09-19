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
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(0), 0);

        resultado.Should().NotBeNull();
        resultado!.DistanciaTotalMetros.Should().Be(0);
        resultado.MetrosPorParada.Should().BeEmpty();
    }

    [Fact]
    public void Calcular_ConUnaSolaParada_LeAsignaTodoElRecorrido()
    {
        // parada en 10, colegio en 0
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(10, 0), 1);

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

        var resultado = RepartoShapley.Calcular(matriz, 2);

        resultado!.DistanciaTotalMetros.Should().Be(20);
        resultado.MetrosPorParada.Should().Equal(10, 10);
    }

    [Fact]
    public void Calcular_LaFamiliaQueQuedaDePaso_PagaMenosQueSuDistanciaDirecta()
    {
        // Colegio en 0, B en 5, A en 10: B está justo sobre el camino de A.
        // Recorrido óptimo A->B->colegio = 10.
        // Shapley exacto: A = 7,5 ; B = 2,5 (verificado a mano).
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(10, 5, 0), 2);

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
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(12, 7, 3, 20, 15, 0), 5);

        resultado!.MetrosPorParada.Sum().Should().Be(resultado.DistanciaTotalMetros);
    }

    [Fact]
    public void Calcular_NuncaDevuelveValoresNegativos()
    {
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(12, 7, 3, 20, 15, 0), 5);

        resultado!.MetrosPorParada.Should().OnlyContain(m => m >= 0);
    }

    [Fact]
    public void Calcular_DentroDelUmbral_MarcaElResultadoComoExacto()
    {
        var resultado = RepartoShapley.Calcular(MatrizEnRecta(10, 5, 0), 2);

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

        var resultado = RepartoShapley.Calcular(MatrizEnRecta(posiciones), cantidad);

        resultado!.EsExacto.Should().BeFalse();
        resultado.MetrosPorParada.Sum().Should().Be(resultado.DistanciaTotalMetros);
        resultado.MetrosPorParada.Should().OnlyContain(m => m >= 0);
    }

    [Fact]
    public void Calcular_ConDistanciasInalcanzables_DevuelveNull()
    {
        var matriz = new[]
        {
            new[] { 0d, double.PositiveInfinity },
            new[] { double.PositiveInfinity, 0d }
        };

        RepartoShapley.Calcular(matriz, 1).Should().BeNull();
    }

    [Fact]
    public void Calcular_ConMatrizDeTamanoIncorrecto_Lanza()
    {
        var accion = () => RepartoShapley.Calcular(MatrizEnRecta(10, 0), 5);

        accion.Should().Throw<ArgumentException>();
    }
}
