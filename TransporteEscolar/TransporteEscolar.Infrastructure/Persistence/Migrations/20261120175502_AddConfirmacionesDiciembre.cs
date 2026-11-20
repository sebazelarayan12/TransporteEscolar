using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddConfirmacionesDiciembre : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConfirmacionesDiciembre",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TitularId = table.Column<int>(type: "integer", nullable: false),
                    Anio = table.Column<int>(type: "integer", nullable: false),
                    Va = table.Column<bool>(type: "boolean", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    PagoMensualId = table.Column<int>(type: "integer", nullable: true),
                    FechaDecision = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfirmacionesDiciembre", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConfirmacionesDiciembre_PagosMensuales_PagoMensualId",
                        column: x => x.PagoMensualId,
                        principalTable: "PagosMensuales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ConfirmacionesDiciembre_Titulares_TitularId",
                        column: x => x.TitularId,
                        principalTable: "Titulares",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConfirmacionesDiciembre_PagoMensualId",
                table: "ConfirmacionesDiciembre",
                column: "PagoMensualId");

            migrationBuilder.CreateIndex(
                name: "IX_ConfirmacionesDiciembre_TitularId_Anio",
                table: "ConfirmacionesDiciembre",
                columns: new[] { "TitularId", "Anio" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConfirmacionesDiciembre");
        }
    }
}
