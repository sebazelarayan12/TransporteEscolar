using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPasajeroHorarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PasajeroHorarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PasajeroId = table.Column<int>(type: "integer", nullable: false),
                    HorarioId = table.Column<int>(type: "integer", nullable: false),
                    EsPrincipal = table.Column<bool>(type: "boolean", nullable: false),
                    Prioridad = table.Column<int>(type: "integer", nullable: false),
                    FechaAsignacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasajeroHorarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasajeroHorarios_Horarios_HorarioId",
                        column: x => x.HorarioId,
                        principalTable: "Horarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PasajeroHorarios_Pasajeros_PasajeroId",
                        column: x => x.PasajeroId,
                        principalTable: "Pasajeros",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PasajeroHorarios_HorarioId",
                table: "PasajeroHorarios",
                column: "HorarioId");

            migrationBuilder.CreateIndex(
                name: "IX_PasajeroHorarios_PasajeroId_HorarioId",
                table: "PasajeroHorarios",
                columns: new[] { "PasajeroId", "HorarioId" },
                unique: true);

            migrationBuilder.Sql(@"
                INSERT INTO ""PasajeroHorarios"" (""PasajeroId"", ""HorarioId"", ""EsPrincipal"", ""Prioridad"", ""FechaAsignacion"")
                SELECT ""Id"", ""HorarioId"", TRUE, 1, COALESCE(""FechaAlta"", NOW() AT TIME ZONE 'UTC')
                FROM ""Pasajeros""
                WHERE ""HorarioId"" IS NOT NULL;
            ");

            migrationBuilder.DropForeignKey(
                name: "FK_Pasajeros_Horarios_HorarioId",
                table: "Pasajeros");

            migrationBuilder.DropIndex(
                name: "IX_Pasajeros_HorarioId",
                table: "Pasajeros");

            migrationBuilder.DropColumn(
                name: "HorarioId",
                table: "Pasajeros");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HorarioId",
                table: "Pasajeros",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(@"
                WITH asignaciones AS (
                    SELECT DISTINCT ON (""PasajeroId"")
                        ""PasajeroId"",
                        ""HorarioId""
                    FROM ""PasajeroHorarios""
                    ORDER BY ""PasajeroId"", ""EsPrincipal"" DESC, ""Prioridad"", ""FechaAsignacion""
                )
                UPDATE ""Pasajeros"" p
                SET ""HorarioId"" = a.""HorarioId""
                FROM asignaciones a
                WHERE a.""PasajeroId"" = p.""Id"";
            ");

            migrationBuilder.DropTable(
                name: "PasajeroHorarios");

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
    }
}
