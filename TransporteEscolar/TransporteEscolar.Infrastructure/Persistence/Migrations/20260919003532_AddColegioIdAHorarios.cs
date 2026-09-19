using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddColegioIdAHorarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ColegioId",
                table: "Horarios",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "ColegioId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 2,
                column: "ColegioId",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 3,
                column: "ColegioId",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 4,
                column: "ColegioId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 5,
                column: "ColegioId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 6,
                column: "ColegioId",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 7,
                column: "ColegioId",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 8,
                column: "ColegioId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 9,
                column: "ColegioId",
                value: 2);

            migrationBuilder.CreateIndex(
                name: "IX_Horarios_ColegioId",
                table: "Horarios",
                column: "ColegioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Horarios_Colegios_ColegioId",
                table: "Horarios",
                column: "ColegioId",
                principalTable: "Colegios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Horarios_Colegios_ColegioId",
                table: "Horarios");

            migrationBuilder.DropIndex(
                name: "IX_Horarios_ColegioId",
                table: "Horarios");

            migrationBuilder.DropColumn(
                name: "ColegioId",
                table: "Horarios");
        }
    }
}
