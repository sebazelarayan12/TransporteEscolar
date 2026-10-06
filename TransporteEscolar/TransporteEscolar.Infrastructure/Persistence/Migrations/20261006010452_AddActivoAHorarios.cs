using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddActivoAHorarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Activo",
                table: "Horarios",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 2,
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 3,
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 4,
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 5,
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 6,
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 7,
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 8,
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 9,
                column: "Activo",
                value: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Activo",
                table: "Horarios");
        }
    }
}
