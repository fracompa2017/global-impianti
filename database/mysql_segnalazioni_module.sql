-- Global Impianti - Modulo Segnalazioni e Guasti (MySQL/MariaDB)
-- Importa questo file DOPO database/mysql_schema.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS segnalazioni (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codice VARCHAR(32) DEFAULT NULL,
  titolo VARCHAR(220) NOT NULL,
  descrizione TEXT NOT NULL,
  tipo ENUM('guasto', 'malfunzionamento', 'manutenzione', 'emergenza', 'richiesta_intervento', 'altro') DEFAULT 'altro',
  priorita ENUM('bassa', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
  stato ENUM('aperta', 'assegnata', 'in_lavorazione', 'risolta', 'chiusa', 'in_attesa') NOT NULL DEFAULT 'aperta',
  cliente VARCHAR(190) DEFAULT NULL,
  indirizzo VARCHAR(255) DEFAULT NULL,
  cantiere_id BIGINT UNSIGNED DEFAULT NULL,
  impianto_tipo ENUM('elettrico', 'idraulico', 'termico', 'fotovoltaico', 'antincendio', 'altro') DEFAULT 'altro',
  created_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_segnalazioni_codice (codice),
  KEY idx_segnalazioni_stato (stato),
  KEY idx_segnalazioni_priorita (priorita),
  KEY idx_segnalazioni_impianto_tipo (impianto_tipo),
  KEY idx_segnalazioni_created_at (created_at),
  KEY idx_segnalazioni_cantiere (cantiere_id),
  KEY idx_segnalazioni_created_by (created_by),
  CONSTRAINT fk_segnalazioni_cantiere FOREIGN KEY (cantiere_id) REFERENCES cantieri(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_segnalazioni_created_by FOREIGN KEY (created_by) REFERENCES profiles(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS segnalazione_foto (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  segnalazione_id BIGINT UNSIGNED NOT NULL,
  url TEXT NOT NULL,
  caption VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_segnalazione_foto_segnalazione_id (segnalazione_id),
  CONSTRAINT fk_segnalazione_foto_segnalazione FOREIGN KEY (segnalazione_id) REFERENCES segnalazioni(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS interventi (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  segnalazione_id BIGINT UNSIGNED NOT NULL,
  titolo VARCHAR(220) DEFAULT NULL,
  data_intervento DATE NOT NULL,
  ora_inizio TIME DEFAULT NULL,
  ora_fine TIME DEFAULT NULL,
  note_pianificazione TEXT DEFAULT NULL,
  created_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_interventi_segnalazione_id (segnalazione_id),
  KEY idx_interventi_data_intervento (data_intervento),
  KEY idx_interventi_created_by (created_by),
  CONSTRAINT fk_interventi_segnalazione FOREIGN KEY (segnalazione_id) REFERENCES segnalazioni(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_interventi_created_by FOREIGN KEY (created_by) REFERENCES profiles(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intervento_assegnazioni (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  intervento_id BIGINT UNSIGNED NOT NULL,
  dipendente_id BIGINT UNSIGNED NOT NULL,
  notifica_inviata TINYINT(1) NOT NULL DEFAULT 0,
  notifica_inviata_at DATETIME DEFAULT NULL,
  calendar_aggiunto TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_intervento_dipendente (intervento_id, dipendente_id),
  KEY idx_intervento_assegnazioni_intervento_id (intervento_id),
  KEY idx_intervento_assegnazioni_dipendente_id (dipendente_id),
  CONSTRAINT fk_intervento_assegnazioni_intervento FOREIGN KEY (intervento_id) REFERENCES interventi(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_intervento_assegnazioni_dipendente FOREIGN KEY (dipendente_id) REFERENCES profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intervento_report (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  intervento_id BIGINT UNSIGNED NOT NULL,
  dipendente_id BIGINT UNSIGNED NOT NULL,
  descrizione_lavori TEXT NOT NULL,
  causa_guasto TEXT DEFAULT NULL,
  soluzione_adottata TEXT DEFAULT NULL,
  materiali_utilizzati TEXT DEFAULT NULL,
  esito ENUM('risolto', 'parzialmente_risolto', 'non_risolto', 'rimesso_in_guasto') DEFAULT 'non_risolto',
  rimesso_in_guasto TINYINT(1) NOT NULL DEFAULT 0,
  motivo_rimessa_guasto TEXT DEFAULT NULL,
  ore_lavorate DECIMAL(8,2) DEFAULT NULL,
  prossimo_intervento_necessario TINYINT(1) NOT NULL DEFAULT 0,
  note_prossimo_intervento TEXT DEFAULT NULL,
  firma_cliente TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_intervento_report_unico (intervento_id, dipendente_id),
  KEY idx_intervento_report_intervento_id (intervento_id),
  KEY idx_intervento_report_dipendente_id (dipendente_id),
  KEY idx_intervento_report_esito (esito),
  CONSTRAINT fk_intervento_report_intervento FOREIGN KEY (intervento_id) REFERENCES interventi(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_intervento_report_dipendente FOREIGN KEY (dipendente_id) REFERENCES profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intervento_foto (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  intervento_id BIGINT UNSIGNED NOT NULL,
  report_id BIGINT UNSIGNED DEFAULT NULL,
  url TEXT NOT NULL,
  caption VARCHAR(255) DEFAULT NULL,
  tipo ENUM('prima', 'durante', 'dopo') DEFAULT 'durante',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_intervento_foto_intervento_id (intervento_id),
  KEY idx_intervento_foto_report_id (report_id),
  CONSTRAINT fk_intervento_foto_intervento FOREIGN KEY (intervento_id) REFERENCES interventi(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_intervento_foto_report FOREIGN KEY (report_id) REFERENCES intervento_report(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS segnalazione_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  segnalazione_id BIGINT UNSIGNED NOT NULL,
  stato_precedente VARCHAR(40) DEFAULT NULL,
  stato_nuovo VARCHAR(40) DEFAULT NULL,
  nota TEXT DEFAULT NULL,
  changed_by BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_segnalazione_history_segnalazione_id (segnalazione_id),
  KEY idx_segnalazione_history_changed_by (changed_by),
  CONSTRAINT fk_segnalazione_history_segnalazione FOREIGN KEY (segnalazione_id) REFERENCES segnalazioni(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_segnalazione_history_changed_by FOREIGN KEY (changed_by) REFERENCES profiles(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS segnalazione_commenti (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  segnalazione_id BIGINT UNSIGNED NOT NULL,
  autore_id BIGINT UNSIGNED NOT NULL,
  testo TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_segnalazione_commenti_segnalazione_id (segnalazione_id),
  KEY idx_segnalazione_commenti_autore_id (autore_id),
  CONSTRAINT fk_segnalazione_commenti_segnalazione FOREIGN KEY (segnalazione_id) REFERENCES segnalazioni(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_segnalazione_commenti_autore FOREIGN KEY (autore_id) REFERENCES profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_segnalazioni_after_insert;
DROP TRIGGER IF EXISTS trg_segnalazioni_after_update;

DELIMITER $$
CREATE TRIGGER trg_segnalazioni_after_insert
AFTER INSERT ON segnalazioni
FOR EACH ROW
BEGIN
  UPDATE segnalazioni
  SET codice = CONCAT('SEG-', YEAR(NEW.created_at), '-', LPAD(NEW.id, 4, '0'))
  WHERE id = NEW.id
    AND (codice IS NULL OR codice = '');

  INSERT INTO segnalazione_history (segnalazione_id, stato_precedente, stato_nuovo, nota, changed_by, created_at)
  VALUES (NEW.id, NULL, NEW.stato, 'Creazione segnalazione', NEW.created_by, NOW());
END$$

CREATE TRIGGER trg_segnalazioni_after_update
AFTER UPDATE ON segnalazioni
FOR EACH ROW
BEGIN
  IF NOT (OLD.stato <=> NEW.stato) THEN
    INSERT INTO segnalazione_history (segnalazione_id, stato_precedente, stato_nuovo, nota, changed_by, created_at)
    VALUES (
      NEW.id,
      OLD.stato,
      NEW.stato,
      COALESCE(@stato_nota, 'Cambio stato'),
      COALESCE(@app_user_id, NEW.created_by),
      NOW()
    );
  END IF;

  SET @stato_nota = NULL;
END$$
DELIMITER ;
