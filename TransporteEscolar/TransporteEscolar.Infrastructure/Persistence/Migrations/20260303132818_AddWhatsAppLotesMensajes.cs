using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWhatsAppLotesMensajes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LotesWhatsApp",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TipoMensaje = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaFinalizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LotesWhatsApp", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MensajesWhatsApp",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LoteId = table.Column<int>(type: "integer", nullable: false),
                    TitularId = table.Column<int>(type: "integer", nullable: false),
                    TelefonoDestino = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    NombreTitular = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ProviderMessageId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DetalleError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Intentos = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MensajesWhatsApp", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MensajesWhatsApp_LotesWhatsApp_LoteId",
                        column: x => x.LoteId,
                        principalTable: "LotesWhatsApp",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MensajesWhatsApp_Titulares_TitularId",
                        column: x => x.TitularId,
                        principalTable: "Titulares",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LotesWhatsApp_Estado",
                table: "LotesWhatsApp",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_LotesWhatsApp_FechaCreacion",
                table: "LotesWhatsApp",
                column: "FechaCreacion");

            migrationBuilder.CreateIndex(
                name: "IX_MensajesWhatsApp_Estado",
                table: "MensajesWhatsApp",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_MensajesWhatsApp_LoteId",
                table: "MensajesWhatsApp",
                column: "LoteId");

            migrationBuilder.CreateIndex(
                name: "IX_MensajesWhatsApp_ProviderMessageId",
                table: "MensajesWhatsApp",
                column: "ProviderMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_MensajesWhatsApp_TitularId",
                table: "MensajesWhatsApp",
                column: "TitularId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MensajesWhatsApp");

            migrationBuilder.DropTable(
                name: "LotesWhatsApp");
        }
    }
}
