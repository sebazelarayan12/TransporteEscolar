using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRecorridos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Recorridos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TitularId = table.Column<int>(type: "integer", nullable: false),
                    ColegioId = table.Column<int>(type: "integer", nullable: false),
                    DistanciaMetros = table.Column<int>(type: "integer", nullable: false),
                    DuracionSegundos = table.Column<int>(type: "integer", nullable: false),
                    GeometriaPolyline = table.Column<string>(type: "character varying(20000)", maxLength: 20000, nullable: true),
                    Proveedor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    HashOrigenDestino = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    FechaCalculo = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recorridos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Recorridos_Colegios_ColegioId",
                        column: x => x.ColegioId,
                        principalTable: "Colegios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Recorridos_Titulares_TitularId",
                        column: x => x.TitularId,
                        principalTable: "Titulares",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Recorridos_ColegioId",
                table: "Recorridos",
                column: "ColegioId");

            migrationBuilder.CreateIndex(
                name: "IX_Recorridos_TitularId_ColegioId",
                table: "Recorridos",
                columns: new[] { "TitularId", "ColegioId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Recorridos");
        }
    }
}
