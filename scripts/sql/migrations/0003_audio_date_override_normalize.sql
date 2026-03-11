UPDATE audio
SET
  date = date_override,
  date_override = NULL
WHERE date_override LIKE '____-__-__';

UPDATE audio
SET
  date = date_override || '-01-01'
WHERE date_override LIKE '____'
  AND date = '1970-01-01';
