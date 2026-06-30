-- ============================================================
-- Ejecutar UNA VEZ en Supabase SQL Editor (Dashboard > SQL Editor)
-- Crea la función exec_sql para que el backend pueda hacer
-- consultas SQL vía la API REST (HTTPS).
-- ============================================================

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT, params JSONB DEFAULT '[]'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  results JSONB := '[]'::jsonb;
  final_sql TEXT;
  i INT;
BEGIN
  final_sql := sql;

  IF params IS NOT NULL AND jsonb_typeof(params) = 'array' THEN
    FOR i IN 0..jsonb_array_length(params) - 1 LOOP
      IF jsonb_typeof(params -> i) = 'null' THEN
        final_sql := replace(final_sql, '$' || (i + 1), 'NULL');
      ELSIF jsonb_typeof(params -> i) = 'number' THEN
        final_sql := replace(final_sql, '$' || (i + 1), params ->> i);
      ELSIF jsonb_typeof(params -> i) = 'boolean' THEN
        final_sql := replace(final_sql, '$' || (i + 1), CASE WHEN (params ->> i)::boolean THEN 'TRUE' ELSE 'FALSE' END);
      ELSE
        final_sql := replace(final_sql, '$' || (i + 1), quote_literal(params ->> i));
      END IF;
    END LOOP;
  END IF;

  BEGIN
    FOR r IN EXECUTE final_sql LOOP
      results := results || row_to_json(r)::jsonb;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    EXECUTE final_sql;
    results := '[]'::jsonb;
  END;

  RETURN results;
END;
$$;
