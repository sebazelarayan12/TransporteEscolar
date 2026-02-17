using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIngresosExternosModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IngresosFijosTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Categoria = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                    DiaDeAplicacion = table.Column<int>(type: "integer", nullable: false),
                    MedioCobro = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EstaActivo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IngresosFijosTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IngresosMensuales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Mes = table.Column<int>(type: "integer", nullable: false),
                    Anio = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Categoria = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MedioCobro = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    EstadoCobro = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IngresoFijoTemplateId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IngresosMensuales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IngresosMensuales_IngresosFijosTemplates_IngresoFijoTemplat~",
                        column: x => x.IngresoFijoTemplateId,
                        principalTable: "IngresosFijosTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IngresosFijosTemplates_EstaActivo_FechaInicio",
                table: "IngresosFijosTemplates",
                columns: new[] { "EstaActivo", "FechaInicio" });

            migrationBuilder.CreateIndex(
                name: "IX_IngresosMensuales_IngresoFijoTemplateId",
                table: "IngresosMensuales",
                column: "IngresoFijoTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_IngresosMensuales_Mes_Anio",
                table: "IngresosMensuales",
                columns: new[] { "Mes", "Anio" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IngresosMensuales");

            migrationBuilder.DropTable(
                name: "IngresosFijosTemplates");
        }
    }
}
