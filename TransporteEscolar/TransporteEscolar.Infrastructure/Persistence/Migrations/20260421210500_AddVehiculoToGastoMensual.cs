using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVehiculoToGastoMensual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Vehiculo",
                table: "GastosMensuales",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Vehiculo",
                table: "GastosMensuales");
        }
    }
}
