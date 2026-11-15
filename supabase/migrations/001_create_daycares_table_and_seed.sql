CREATE TABLE daycares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daycares ENABLE ROW LEVEL SECURITY;

-- Política de lectura: cualquiera puede leer
CREATE POLICY "daycares_read" ON daycares
  FOR SELECT
  USING (true);

-- Políticas de escritura: restringidas
CREATE POLICY "daycares_insert" ON daycares
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "daycares_update" ON daycares
  FOR UPDATE
  USING (false);

CREATE POLICY "daycares_delete" ON daycares
  FOR DELETE
  USING (false);

-- Seed: el id lo genera el default gen_random_uuid()
INSERT INTO daycares (name, address) VALUES
  ('Guardería Sala Soles', 'Av. del Sol 1234'),
  ('Guardería Pequeños Astros', 'Calle Luna 512'),
  ('Guardería Arcoíris', 'Av. Rivera 980'),
  ('Guardería Lunita', 'Pasaje Verde 45'),
  ('Guardería Nubecita', 'Calle Real 2200');
