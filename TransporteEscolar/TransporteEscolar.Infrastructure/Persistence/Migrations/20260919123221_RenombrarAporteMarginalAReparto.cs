using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenombrarAporteMarginalAReparto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AportesMarginales");

            migrationBuilder.CreateTable(
                name: "AportesReparto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RecorridoHorarioId = table.Column<int>(type: "integer", nullable: false),
                    TitularId = table.Column<int>(type: "integer", nullable: false),
                    MetrosAsignados = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AportesReparto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AportesReparto_RecorridosHorario_RecorridoHorarioId",
                        column: x => x.RecorridoHorarioId,
                        principalTable: "RecorridosHorario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AportesReparto_Titulares_TitularId",
                        column: x => x.TitularId,
                        principalTable: "Titulares",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AportesReparto_RecorridoHorarioId_TitularId",
                table: "AportesReparto",
                columns: new[] { "RecorridoHorarioId", "TitularId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AportesReparto_TitularId",
                table: "AportesReparto",
                column: "TitularId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AportesReparto");

            migrationBuilder.CreateTable(
                name: "AportesMarginales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MetrosMarginales = table.Column<int>(type: "integer", nullable: false),
                    RecorridoHorarioId = table.Column<int>(type: "integer", nullable: false),
                    TitularId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AportesMarginales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AportesMarginales_RecorridosHorario_RecorridoHorarioId",
                        column: x => x.RecorridoHorarioId,
                        principalTable: "RecorridosHorario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AportesMarginales_Titulares_TitularId",
                        column: x => x.TitularId,
                        principalTable: "Titulares",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AportesMarginales_RecorridoHorarioId_TitularId",
                table: "AportesMarginales",
                columns: new[] { "RecorridoHorarioId", "TitularId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AportesMarginales_TitularId",
                table: "AportesMarginales",
                column: "TitularId");
        }
    }
}
