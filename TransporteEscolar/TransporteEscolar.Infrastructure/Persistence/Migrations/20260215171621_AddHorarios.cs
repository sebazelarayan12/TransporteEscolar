using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHorarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HorarioId",
                table: "Pasajeros",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Horarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Etiqueta = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Horarios", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Horarios",
                columns: new[] { "Id", "Etiqueta", "Orden" },
                values: new object[,]
                {
                    { 1, "8 San Patricio", 1 },
                    { 2, "8 Boisdron", 2 },
                    { 3, "9 Boisdron", 3 },
                    { 4, "9 San Patricio", 4 },
                    { 5, "12 San Patricio", 5 },
                    { 6, "13 Boisdron Entrada", 6 },
                    { 7, "13 Boisdron Salida", 7 },
                    { 8, "16 San Patricio", 8 },
                    { 9, "17 Boisdron", 9 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pasajeros_HorarioId",
                table: "Pasajeros",
                column: "HorarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pasajeros_Horarios_HorarioId",
                table: "Pasajeros",
                column: "HorarioId",
                principalTable: "Horarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pasajeros_Horarios_HorarioId",
                table: "Pasajeros");

            migrationBuilder.DropTable(
                name: "Horarios");

            migrationBuilder.DropIndex(
                name: "IX_Pasajeros_HorarioId",
                table: "Pasajeros");

            migrationBuilder.DropColumn(
                name: "HorarioId",
                table: "Pasajeros");
        }
    }
}
