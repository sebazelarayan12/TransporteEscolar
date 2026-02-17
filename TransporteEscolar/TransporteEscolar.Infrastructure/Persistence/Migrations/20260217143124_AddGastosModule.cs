using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGastosModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GastosFijosTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Categoria = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                    DiaDeAplicacion = table.Column<int>(type: "integer", nullable: false),
                    MedioPago = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    EstaActivo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    FechaInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GastosFijosTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GastosMensuales",
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
                    MedioPago = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    EstadoPago = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    GastoFijoTemplateId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GastosMensuales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GastosMensuales_GastosFijosTemplates_GastoFijoTemplateId",
                        column: x => x.GastoFijoTemplateId,
                        principalTable: "GastosFijosTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GastosFijosTemplates_EstaActivo_FechaInicio",
                table: "GastosFijosTemplates",
                columns: new[] { "EstaActivo", "FechaInicio" });

            migrationBuilder.CreateIndex(
                name: "IX_GastosMensuales_GastoFijoTemplateId",
                table: "GastosMensuales",
                column: "GastoFijoTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_GastosMensuales_Mes_Anio",
                table: "GastosMensuales",
                columns: new[] { "Mes", "Anio" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GastosMensuales");

            migrationBuilder.DropTable(
                name: "GastosFijosTemplates");
        }
    }
}
