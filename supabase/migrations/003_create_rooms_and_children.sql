CREATE TYPE child_status AS ENUM ('active', 'archived');

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id),
  slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  birth_date date NOT NULL,
  enrolled_at date NOT NULL DEFAULT current_date,
  medical_notes text,
  allergy_tags text[] NOT NULL DEFAULT '{}',
  photo_consent boolean NOT NULL DEFAULT true,
  status child_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rooms_daycare_id_idx ON rooms(daycare_id);
CREATE INDEX children_room_id_idx ON children(room_id);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Las policies subconsultan `users`, cuya RLS deja leer solo la fila propia.
CREATE POLICY "rooms_read" ON rooms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
      AND u.daycare_id = rooms.daycare_id
      AND u.role IN ('staff', 'admin')
  ));

CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (false);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (false);
CREATE POLICY "rooms_delete" ON rooms FOR DELETE USING (false);

CREATE POLICY "children_read" ON children FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rooms r
    JOIN users u ON u.daycare_id = r.daycare_id
    WHERE r.id = children.room_id
      AND u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
  ));

CREATE POLICY "children_insert" ON children FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM rooms r
    JOIN users u ON u.daycare_id = r.daycare_id
    WHERE r.id = children.room_id
      AND u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
  ));

CREATE POLICY "children_update" ON children FOR UPDATE USING (false);
CREATE POLICY "children_delete" ON children FOR DELETE USING (false);

INSERT INTO rooms (daycare_id, name)
SELECT d.id, room.name
FROM daycares d
CROSS JOIN (VALUES ('Soles'), ('Lunas'), ('Estrellas'), ('Arcoíris')) AS room(name)
WHERE d.name = 'Guardería Sala Soles';
