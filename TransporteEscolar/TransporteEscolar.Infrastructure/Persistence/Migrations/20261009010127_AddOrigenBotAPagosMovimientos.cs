using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrigenBotAPagosMovimientos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCreacion",
                table: "PagosMovimientos",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GrupoId",
                table: "PagosMovimientos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrigenMensajeId",
                table: "PagosMovimientos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PagosMovimientos_GrupoId",
                table: "PagosMovimientos",
                column: "GrupoId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosMovimientos_OrigenMensajeId_PagoMensualId",
                table: "PagosMovimientos",
                columns: new[] { "OrigenMensajeId", "PagoMensualId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PagosMovimientos_GrupoId",
                table: "PagosMovimientos");

            migrationBuilder.DropIndex(
                name: "IX_PagosMovimientos_OrigenMensajeId_PagoMensualId",
                table: "PagosMovimientos");

            migrationBuilder.DropColumn(
                name: "FechaCreacion",
                table: "PagosMovimientos");

            migrationBuilder.DropColumn(
                name: "GrupoId",
                table: "PagosMovimientos");

            migrationBuilder.DropColumn(
                name: "OrigenMensajeId",
                table: "PagosMovimientos");
        }
    }
}
