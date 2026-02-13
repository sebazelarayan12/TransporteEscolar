Ver versión (smoke test)

docker compose exec postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-TransporteEscolarDb} -c "SELECT version();"
Ver bases (útil para confirmar DB)

docker compose exec postgres psql -U ${POSTGRES_USER:-postgres} -c "\l"


ambiente de testing

cd "c:/Users/sebaz/Documents/Transporte/TransporteEscolar/TransporteEscolar.Api"
dotnet run --launch-profile Testing
