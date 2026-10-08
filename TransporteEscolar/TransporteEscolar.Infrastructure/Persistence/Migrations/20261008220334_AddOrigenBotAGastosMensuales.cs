using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrigenBotAGastosMensuales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCreacion",
                table: "GastosMensuales",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrigenMensajeId",
                table: "GastosMensuales",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_GastosMensuales_OrigenMensajeId",
                table: "GastosMensuales",
                column: "OrigenMensajeId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GastosMensuales_OrigenMensajeId",
                table: "GastosMensuales");

            migrationBuilder.DropColumn(
                name: "FechaCreacion",
                table: "GastosMensuales");

            migrationBuilder.DropColumn(
                name: "OrigenMensajeId",
                table: "GastosMensuales");
        }
    }
}
