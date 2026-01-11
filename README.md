Ver versión (smoke test)

docker compose exec sqlserver bash -lc '/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT @@VERSION;"'
Ver bases (útil para confirmar DB)

docker compose exec sqlserver bash -lc '/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT name FROM sys.databases;"'


ambiente de testing

cd "c:/Users/sebaz/Documents/Transporte/TransporteEscolar/TransporteEscolar.Api"
dotnet run --launch-profile Testing