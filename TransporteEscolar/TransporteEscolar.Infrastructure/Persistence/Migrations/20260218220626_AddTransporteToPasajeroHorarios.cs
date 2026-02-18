using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransporteEscolar.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTransporteToPasajeroHorarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte>(
                name: "Transporte",
                table: "PasajeroHorarios",
                type: "smallint",
                nullable: false,
                defaultValue: (byte)1);

            migrationBuilder.AddCheckConstraint(
                name: "CK_PasajeroHorarios_Transporte",
                table: "PasajeroHorarios",
                sql: "Transporte IN (1,2)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_PasajeroHorarios_Transporte",
                table: "PasajeroHorarios");

            migrationBuilder.DropColumn(
                name: "Transporte",
                table: "PasajeroHorarios");
        }
    }
}
