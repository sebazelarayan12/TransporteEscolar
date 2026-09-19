using FluentAssertions;
using TransporteEscolar.Domain.Services;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Tests.Domain;

public class RecorridoHashTests
{
    private static readonly Coordenada Casa = new(-26.8225289, -65.2860859);
    private static readonly Coordenada Colegio = new(-26.8158608, -65.2742406);

    [Fact]
    public void Calcular_ConLasMismasCoordenadas_DevuelveElMismoHash()
    {
        var primero = RecorridoHash.Calcular(Casa, Colegio);
        var segundo = RecorridoHash.Calcular(Casa, Colegio);

        primero.Should().Be(segundo);
    }

    [Fact]
    public void Calcular_SiSeMueveElPin_DevuelveUnHashDistinto()
    {
        var original = RecorridoHash.Calcular(Casa, Colegio);
        var mudanza = RecorridoHash.Calcular(new Coordenada(-26.7300, -65.2800), Colegio);

        mudanza.Should().NotBe(original);
    }

    [Fact]
    public void Calcular_InvirtiendoOrigenYDestino_DevuelveUnHashDistinto()
    {
        var ida = RecorridoHash.Calcular(Casa, Colegio);
        var vuelta = RecorridoHash.Calcular(Colegio, Casa);

        vuelta.Should().NotBe(ida);
    }

    [Fact]
    public void Calcular_IgnoraDiferenciasMasAlaDeSeisDecimales()
    {
        // Seis decimales son ~11 cm. Por debajo de eso es ruido de punto flotante,
        // no una mudanza. Sin este redondeo el recorrido se recalcularía solo.
        var original = RecorridoHash.Calcular(Casa, Colegio);
        var ruido = RecorridoHash.Calcular(new Coordenada(-26.82252890001, -65.2860859), Colegio);

        ruido.Should().Be(original);
    }

    [Fact]
    public void Calcular_DevuelveDieciseisCaracteresHexadecimales()
    {
        var hash = RecorridoHash.Calcular(Casa, Colegio);

        hash.Should().HaveLength(16);
        hash.Should().MatchRegex("^[0-9A-F]{16}$");
    }
}
