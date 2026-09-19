-- Valores distintos de Pasajero.Colegio y si matchean con la tabla Colegios.
-- Todo lo que salga con matchea = false necesita normalizarse antes de confiar en el análisis.
SELECT
    p."Colegio"                         AS valor_en_pasajeros,
    COUNT(*)                            AS cantidad_pasajeros,
    (c."Id" IS NOT NULL)                AS matchea,
    c."Id"                              AS colegio_id
FROM "Pasajeros" p
LEFT JOIN "Colegios" c
       ON LOWER(TRIM(c."Nombre")) = LOWER(TRIM(p."Colegio"))
WHERE p."FechaBaja" IS NULL
GROUP BY p."Colegio", c."Id"
ORDER BY matchea, cantidad_pasajeros DESC;
