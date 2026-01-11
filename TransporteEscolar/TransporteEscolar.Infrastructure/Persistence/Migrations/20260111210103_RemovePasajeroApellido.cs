using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemovePasajeroApellido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pasajeros_TitularId_Nombre_Apellido",
                table: "Pasajeros");

            migrationBuilder.DropColumn(
                name: "Apellido",
                table: "Pasajeros");

            migrationBuilder.CreateIndex(
                name: "IX_Pasajeros_TitularId_Nombre",
                table: "Pasajeros",
                columns: new[] { "TitularId", "Nombre" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pasajeros_TitularId_Nombre",
                table: "Pasajeros");

            migrationBuilder.AddColumn<string>(
                name: "Apellido",
                table: "Pasajeros",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Pasajeros_TitularId_Nombre_Apellido",
                table: "Pasajeros",
                columns: new[] { "TitularId", "Nombre", "Apellido" },
                unique: true);
        }
    }
}
