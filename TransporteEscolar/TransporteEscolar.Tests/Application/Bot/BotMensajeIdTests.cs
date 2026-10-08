using FluentAssertions;
using TransporteEscolar.Application.Bot;

namespace TransporteEscolar.Tests.Application.Bot;

public class BotMensajeIdTests
{
    [Fact]
    public void Hashear_de_abc_coincide_con_el_vector_conocido_de_sha256()
    {
        BotMensajeId.Hashear("abc").Should().Be("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    [Fact]
    public void Hashear_devuelve_64_caracteres_hexadecimales_en_minuscula()
    {
        var hash = BotMensajeId.Hashear("false_5490000000000@c.us_ABC");

        hash.Should().HaveLength(64);
        hash.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public void Hashear_ignora_espacios_alrededor_del_id()
    {
        BotMensajeId.Hashear("  abc  ").Should().Be(BotMensajeId.Hashear("abc"));
    }

    [Fact]
    public void Ids_distintos_dan_hashes_distintos()
    {
        BotMensajeId.Hashear("msg-1").Should().NotBe(BotMensajeId.Hashear("msg-2"));
    }

    [Fact]
    public void El_hash_no_contiene_el_telefono_del_remitente()
    {
        var hash = BotMensajeId.Hashear("false_5490000000000@c.us_ABC");

        hash.Should().NotContain("5490000000000");
    }
}
