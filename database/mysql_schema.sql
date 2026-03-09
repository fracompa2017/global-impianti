-- Global Impianti - Schema MySQL/MariaDB (IONOS)
-- Importa questo file in phpMyAdmin.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifiche;
DROP TABLE IF EXISTS preventivi;
DROP TABLE IF EXISTS documenti;
DROP TABLE IF EXISTS milestones;
DROP TABLE IF EXISTS report_foto;
DROP TABLE IF EXISTS report_giornalieri;
DROP TABLE IF EXISTS timbrature;
DROP TABLE IF EXISTS turni;
DROP TABLE IF EXISTS cantiere_assegnazioni;
DROP TABLE IF EXISTS cantieri;
DROP TABLE IF EXISTS profiles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(180) DEFAULT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(80) DEFAULT NULL,
  role ENUM('admin', 'dipendente') NOT NULL DEFAULT 'dipendente',
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT DEFAULT NULL,
  push_subscription JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_profiles_email (email),
  KEY idx_profiles_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cantieri (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(190) NOT NULL,
  cliente VARCHAR(190) DEFAULT NULL,
  indirizzo VARCHAR(255) DEFAULT NULL,
  descrizione TEXT DEFAULT NULL,
  stato ENUM('pianificato', 'in_corso', 'completato', 'sospeso') DEFAULT 'pianificato',
  data_inizio DATE DEFAULT NULL,
  data_fine_prevista DATE DEFAULT NULL,
  data_fine_effettiva DATE DEFAULT NULL,
  note TEXT DEFAULT NULL,
  created_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cantieri_stato (stato),
  KEY idx_cantieri_created_by (created_by),
  CONSTRAINT fk_cantieri_created_by FOREIGN KEY (created_by) REFERENCES profiles (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cantiere_assegnazioni (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cantiere_id BIGINT UNSIGNED NOT NULL,
  dipendente_id BIGINT UNSIGNED NOT NULL,
  data_inizio DATE DEFAULT NULL,
  data_fine DATE DEFAULT NULL,
  ruolo_cantiere VARCHAR(120) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cantiere_dipendente (cantiere_id, dipendente_id),
  KEY idx_assegnazioni_dipendente (dipendente_id),
  CONSTRAINT fk_assegnazioni_cantiere FOREIGN KEY (cantiere_id) REFERENCES cantieri (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_assegnazioni_dipendente FOREIGN KEY (dipendente_id) REFERENCES profiles (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE turni (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dipendente_id BIGINT UNSIGNED NOT NULL,
  cantiere_id BIGINT UNSIGNED NOT NULL,
  data DATE NOT NULL,
  ora_inizio TIME DEFAULT NULL,
  ora_fine TIME DEFAULT NULL,
  note TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_turni_dip_data (dipendente_id, data),
  KEY idx_turni_cantiere (cantiere_id),
  CONSTRAINT fk_turni_dipendente FOREIGN KEY (dipendente_id) REFERENCES profiles (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_turni_cantiere FOREIGN KEY (cantiere_id) REFERENCES cantieri (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE timbrature (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dipendente_id BIGINT UNSIGNED NOT NULL,
  cantiere_id BIGINT UNSIGNED NOT NULL,
  data DATE NOT NULL,
  ora_entrata DATETIME DEFAULT NULL,
  ora_uscita DATETIME DEFAULT NULL,
  ore_totali DECIMAL(8,2)
    GENERATED ALWAYS AS (
      CASE
        WHEN ora_entrata IS NULL OR ora_uscita IS NULL THEN NULL
        ELSE TIMESTAMPDIFF(SECOND, ora_entrata, ora_uscita) / 3600
      END
    ) STORED,
  note TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_timbrature_dip_data (dipendente_id, data),
  KEY idx_timbrature_cantiere (cantiere_id),
  CONSTRAINT fk_timbrature_dipendente FOREIGN KEY (dipendente_id) REFERENCES profiles (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_timbrature_cantiere FOREIGN KEY (cantiere_id) REFERENCES cantieri (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE report_giornalieri (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dipendente_id BIGINT UNSIGNED NOT NULL,
  cantiere_id BIGINT UNSIGNED NOT NULL,
  data DATE NOT NULL,
  testo TEXT DEFAULT NULL,
  testo_generato_ai TEXT DEFAULT NULL,
  meteo VARCHAR(180) DEFAULT NULL,
  materiali_utilizzati TEXT DEFAULT NULL,
  problemi_riscontrati TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_report_dip_data (dipendente_id, data),
  KEY idx_report_cantiere (cantiere_id),
  CONSTRAINT fk_report_dipendente FOREIGN KEY (dipendente_id) REFERENCES profiles (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_report_cantiere FOREIGN KEY (cantiere_id) REFERENCES cantieri (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE report_foto (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id BIGINT UNSIGNED NOT NULL,
  url TEXT NOT NULL,
  caption VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_report_foto_report (report_id),
  CONSTRAINT fk_report_foto_report FOREIGN KEY (report_id) REFERENCES report_giornalieri (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE milestones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cantiere_id BIGINT UNSIGNED NOT NULL,
  titolo VARCHAR(190) NOT NULL,
  descrizione TEXT DEFAULT NULL,
  data_prevista DATE DEFAULT NULL,
  data_completamento DATE DEFAULT NULL,
  completata TINYINT(1) NOT NULL DEFAULT 0,
  percentuale_avanzamento INT NOT NULL DEFAULT 0,
  ordine INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_milestones_cantiere_ordine (cantiere_id, ordine),
  CONSTRAINT fk_milestones_cantiere FOREIGN KEY (cantiere_id) REFERENCES cantieri (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE documenti (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dipendente_id BIGINT UNSIGNED NOT NULL,
  cantiere_id BIGINT UNSIGNED DEFAULT NULL,
  tipo ENUM('busta_paga', 'certificato', 'contratto', 'altro') DEFAULT 'altro',
  nome VARCHAR(190) NOT NULL,
  url TEXT NOT NULL,
  mese TINYINT UNSIGNED DEFAULT NULL,
  anno SMALLINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_documenti_dipendente_data (dipendente_id, created_at),
  KEY idx_documenti_cantiere (cantiere_id),
  CONSTRAINT fk_documenti_dipendente FOREIGN KEY (dipendente_id) REFERENCES profiles (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_documenti_cantiere FOREIGN KEY (cantiere_id) REFERENCES cantieri (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE preventivi (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cantiere_id BIGINT UNSIGNED DEFAULT NULL,
  cliente VARCHAR(190) DEFAULT NULL,
  titolo VARCHAR(190) DEFAULT NULL,
  stato ENUM('bozza', 'inviato', 'accettato', 'rifiutato') DEFAULT 'bozza',
  contenuto_ai JSON DEFAULT NULL,
  totale DECIMAL(12,2) DEFAULT NULL,
  pdf_url TEXT DEFAULT NULL,
  created_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_preventivi_cantiere (cantiere_id),
  KEY idx_preventivi_created_by (created_by),
  CONSTRAINT fk_preventivi_cantiere FOREIGN KEY (cantiere_id) REFERENCES cantieri (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_preventivi_created_by FOREIGN KEY (created_by) REFERENCES profiles (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifiche (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  destinatario_id BIGINT UNSIGNED NOT NULL,
  titolo VARCHAR(190) DEFAULT NULL,
  messaggio TEXT DEFAULT NULL,
  tipo VARCHAR(80) DEFAULT NULL,
  letta TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifiche_dest_data (destinatario_id, created_at),
  CONSTRAINT fk_notifiche_destinatario FOREIGN KEY (destinatario_id) REFERENCES profiles (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin iniziale:
-- 1) genera hash password con https://www.php.net/password_hash oppure script locale PHP.
-- 2) esegui una insert come questa:
-- INSERT INTO profiles (full_name, email, phone, role, password_hash)
-- VALUES ('Admin Global Impianti', 'admin@globalimpianti.it', NULL, 'admin', '$2y$10$...');
