using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Services;
using TransporteEscolar.Infrastructure.Repositories;

namespace TransporteEscolar.Infrastructure.Persistence.Seeders;

public static class TestDataSeeder
{
    private const string ActualizacionTitulo = "Actualización de gastos";
    private const string ActualizacionDescripcion = "agregada la funcion de cuotas en gastos fijos";

    public static void SeedTestData(AppDbContext context)
    {
        SeedTestDataAsync(context).GetAwaiter().GetResult();
    }

    public static async Task SeedTestDataAsync(AppDbContext context)
    {
        var notificacionService = new NotificacionService(new NotificacionRepository(context));
        Console.WriteLine("ℹ️ Seeders deshabilitados: solo se actualiza la notificación global.");

        await RegistrarActualizacionProductoAsync(notificacionService);
    }

    private static async Task RegistrarActualizacionProductoAsync(INotificacionService notificacionService)
    {
        var request = new NotificacionModel.ActualizacionRequest(
            ActualizacionTitulo,
            ActualizacionDescripcion,
            DateTime.UtcNow,
            null);

        // Mantiene la última actualización visible hasta que el usuario registre un nuevo mensaje.
        await notificacionService.GuardarActualizacionProductoAsync(request);
    }
}
