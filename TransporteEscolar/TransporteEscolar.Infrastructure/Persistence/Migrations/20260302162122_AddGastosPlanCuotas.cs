using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGastosPlanCuotas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Monto",
                table: "GastosFijosTemplates",
                newName: "MontoOriginal");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaActualizacion",
                table: "GastosMensuales",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NumeroCuota",
                table: "GastosMensuales",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalCuotas",
                table: "GastosMensuales",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CantidadCuotas",
                table: "GastosFijosTemplates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EsPlanCuotas",
                table: "GastosFijosTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaPrimeraCuota",
                table: "GastosFijosTemplates",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MontoCuota",
                table: "GastosFijosTemplates",
                type: "numeric(12,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.Sql("UPDATE \"GastosFijosTemplates\" SET \"MontoCuota\" = \"MontoOriginal\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaActualizacion",
                table: "GastosMensuales");

            migrationBuilder.DropColumn(
                name: "NumeroCuota",
                table: "GastosMensuales");

            migrationBuilder.DropColumn(
                name: "TotalCuotas",
                table: "GastosMensuales");

            migrationBuilder.DropColumn(
                name: "CantidadCuotas",
                table: "GastosFijosTemplates");

            migrationBuilder.DropColumn(
                name: "EsPlanCuotas",
                table: "GastosFijosTemplates");

            migrationBuilder.DropColumn(
                name: "FechaPrimeraCuota",
                table: "GastosFijosTemplates");

            migrationBuilder.DropColumn(
                name: "MontoCuota",
                table: "GastosFijosTemplates");

            migrationBuilder.RenameColumn(
                name: "MontoOriginal",
                table: "GastosFijosTemplates",
                newName: "Monto");
        }
    }
}
