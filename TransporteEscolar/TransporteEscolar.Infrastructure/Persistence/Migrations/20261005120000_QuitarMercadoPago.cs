using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Elimina de PagosMensuales las columnas de Mercado Pago (la integracion se descarto).
    /// Escrita a mano como inverso exacto de add_mercadopago_fields_pagomensual; no tiene Designer.
    /// </summary>
    [DbContext(typeof(AppDbContext))]
    [Migration("20261005120000_QuitarMercadoPago")]
    public partial class QuitarMercadoPago : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PagosMensuales_MercadoPagoPreferenceId",
                table: "PagosMensuales");

            migrationBuilder.DropColumn(
                name: "MercadoPagoGeneratedAt",
                table: "PagosMensuales");

            migrationBuilder.DropColumn(
                name: "MercadoPagoPaymentId",
                table: "PagosMensuales");

            migrationBuilder.DropColumn(
                name: "MercadoPagoPreferenceId",
                table: "PagosMensuales");

            migrationBuilder.DropColumn(
                name: "MercadoPagoUrl",
                table: "PagosMensuales");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "MercadoPagoGeneratedAt",
                table: "PagosMensuales",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MercadoPagoPaymentId",
                table: "PagosMensuales",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MercadoPagoPreferenceId",
                table: "PagosMensuales",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MercadoPagoUrl",
                table: "PagosMensuales",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PagosMensuales_MercadoPagoPreferenceId",
                table: "PagosMensuales",
                column: "MercadoPagoPreferenceId",
                unique: true,
                filter: "\"MercadoPagoPreferenceId\" IS NOT NULL");
        }
    }
}
