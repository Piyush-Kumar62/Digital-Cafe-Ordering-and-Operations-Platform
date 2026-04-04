-- Remove duplicates safely in MySQL (keeps the lowest id)

-- Institutions: same name + city + state
DELETE i1
FROM institutions i1
JOIN institutions i2
  ON LOWER(i1.name) = LOWER(i2.name)
  AND IFNULL(LOWER(i1.city), '') = IFNULL(LOWER(i2.city), '')
  AND IFNULL(LOWER(i1.state), '') = IFNULL(LOWER(i2.state), '')
  AND i1.id > i2.id;

-- Degrees: same name
DELETE d1
FROM degrees d1
JOIN degrees d2
  ON LOWER(d1.name) = LOWER(d2.name)
  AND d1.id > d2.id;

-- Branches: same degree_id + name
DELETE b1
FROM branches b1
JOIN branches b2
  ON b1.degree_id = b2.degree_id
  AND LOWER(b1.name) = LOWER(b2.name)
  AND b1.id > b2.id;
