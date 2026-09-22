using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRecorridosHorarioYAportesMarginales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecorridosHorario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HorarioId = table.Column<int>(type: "integer", nullable: false),
                    Transporte = table.Column<byte>(type: "smallint", nullable: false),
                    DistanciaTotalMetros = table.Column<int>(type: "integer", nullable: false),
                    CantidadParadas = table.Column<int>(type: "integer", nullable: false),
                    FechaCalculo = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecorridosHorario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecorridosHorario_Horarios_HorarioId",
                        column: x => x.HorarioId,
                        principalTable: "Horarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AportesMarginales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RecorridoHorarioId = table.Column<int>(type: "integer", nullable: false),
                    TitularId = table.Column<int>(type: "integer", nullable: false),
                    MetrosMarginales = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AportesMarginales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AportesMarginales_RecorridosHorario_RecorridoHorarioId",
                        column: x => x.RecorridoHorarioId,
                        principalTable: "RecorridosHorario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AportesMarginales_Titulares_TitularId",
                        column: x => x.TitularId,
                        principalTable: "Titulares",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AportesMarginales_RecorridoHorarioId_TitularId",
                table: "AportesMarginales",
                columns: new[] { "RecorridoHorarioId", "TitularId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AportesMarginales_TitularId",
                table: "AportesMarginales",
                column: "TitularId");

            migrationBuilder.CreateIndex(
                name: "IX_RecorridosHorario_HorarioId_Transporte",
                table: "RecorridosHorario",
                columns: new[] { "HorarioId", "Transporte" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AportesMarginales");

            migrationBuilder.DropTable(
                name: "RecorridosHorario");
        }
    }
}
