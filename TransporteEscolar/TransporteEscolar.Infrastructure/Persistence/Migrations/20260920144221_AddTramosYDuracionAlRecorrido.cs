using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTramosYDuracionAlRecorrido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DuracionTotalSegundos",
                table: "RecorridosHorario",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MetrosTramoFinal",
                table: "RecorridosHorario",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MetrosTramoAnterior",
                table: "AportesReparto",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DuracionTotalSegundos",
                table: "RecorridosHorario");

            migrationBuilder.DropColumn(
                name: "MetrosTramoFinal",
                table: "RecorridosHorario");

            migrationBuilder.DropColumn(
                name: "MetrosTramoAnterior",
                table: "AportesReparto");
        }
    }
}
