using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class add_mercadopago_fields_pagomensual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
    }
}
