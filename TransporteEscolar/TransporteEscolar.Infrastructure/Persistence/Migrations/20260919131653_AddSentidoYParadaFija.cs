using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSentidoYParadaFija : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Sentido",
                table: "Horarios",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Orden",
                table: "AportesReparto",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ParadasFijas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HorarioId = table.Column<int>(type: "integer", nullable: false),
                    Transporte = table.Column<byte>(type: "smallint", nullable: false),
                    TitularId = table.Column<int>(type: "integer", nullable: false),
                    FechaAsignacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParadasFijas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParadasFijas_Horarios_HorarioId",
                        column: x => x.HorarioId,
                        principalTable: "Horarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ParadasFijas_Titulares_TitularId",
                        column: x => x.TitularId,
                        principalTable: "Titulares",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "Sentido",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 2,
                column: "Sentido",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 3,
                column: "Sentido",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 4,
                column: "Sentido",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 5,
                column: "Sentido",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 6,
                column: "Sentido",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 7,
                column: "Sentido",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 8,
                column: "Sentido",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Horarios",
                keyColumn: "Id",
                keyValue: 9,
                column: "Sentido",
                value: 2);

            migrationBuilder.CreateIndex(
                name: "IX_ParadasFijas_HorarioId_Transporte",
                table: "ParadasFijas",
                columns: new[] { "HorarioId", "Transporte" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ParadasFijas_TitularId",
                table: "ParadasFijas",
                column: "TitularId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ParadasFijas");

            migrationBuilder.DropColumn(
                name: "Sentido",
                table: "Horarios");

            migrationBuilder.DropColumn(
                name: "Orden",
                table: "AportesReparto");
        }
    }
}
