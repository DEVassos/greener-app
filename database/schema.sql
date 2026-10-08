BEGIN;

CREATE TABLE IF NOT EXISTS services (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    external_id text NOT NULL,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'ativo',
    country text,
    region text,
    city text,
    latitude numeric(8,6),
    longitude numeric(9,6),
    first_seen_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT services_external_id_unique UNIQUE (external_id),
    CONSTRAINT services_status_valid CHECK (
        status IN ('ativo', 'indisponivel', 'sem_metricas', 'removido')
    ),
    CONSTRAINT services_latitude_valid CHECK (
        latitude IS NULL OR latitude BETWEEN -90 AND 90
    ),
    CONSTRAINT services_longitude_valid CHECK (
        longitude IS NULL OR longitude BETWEEN -180 AND 180
    ),
    CONSTRAINT services_last_seen_after_first_seen CHECK (
        last_seen_at IS NULL OR last_seen_at >= first_seen_at
    )
);

CREATE TABLE IF NOT EXISTS users (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT users_email_format_valid CHECK (
        email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),
    CONSTRAINT users_password_hash_bcrypt_valid CHECK (
        password_hash ~ '^\$2[aby]\$[0-9]{2}\$' AND char_length(password_hash) = 60
    )
);

CREATE TABLE IF NOT EXISTS collections (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_id bigint NOT NULL,
    collected_at timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'ok',
    cpu_percent numeric(5,2),
    memory_bytes numeric(20,0),
    disk_bytes numeric(20,0),
    network_bytes numeric(20,0),
    power_watts numeric(14,6),
    energy_kwh numeric(14,6),
    co2e_grams numeric(14,6),
    metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT collections_service_fk FOREIGN KEY (service_id)
        REFERENCES services (id) ON DELETE RESTRICT,
    CONSTRAINT collections_status_valid CHECK (
        status IN ('ok', 'erro', 'sem_metricas')
    ),
    CONSTRAINT collections_cpu_percent_valid CHECK (
        cpu_percent IS NULL OR cpu_percent BETWEEN 0 AND 100
    ),
    CONSTRAINT collections_memory_bytes_valid CHECK (
        memory_bytes IS NULL OR memory_bytes >= 0
    ),
    CONSTRAINT collections_disk_bytes_valid CHECK (
        disk_bytes IS NULL OR disk_bytes >= 0
    ),
    CONSTRAINT collections_network_bytes_valid CHECK (
        network_bytes IS NULL OR network_bytes >= 0
    ),
    CONSTRAINT collections_power_watts_valid CHECK (
        power_watts IS NULL OR power_watts >= 0
    ),
    CONSTRAINT collections_energy_kwh_valid CHECK (
        energy_kwh IS NULL OR energy_kwh >= 0
    ),
    CONSTRAINT collections_co2e_grams_valid CHECK (
        co2e_grams IS NULL OR co2e_grams >= 0
    ),
    CONSTRAINT collections_metrics_object_valid CHECK (
        jsonb_typeof(metrics) = 'object'
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
    ON users (lower(email));

CREATE INDEX IF NOT EXISTS collections_service_collected_at_idx
    ON collections (service_id, collected_at DESC);

CREATE INDEX IF NOT EXISTS collections_collected_at_idx
    ON collections (collected_at DESC);

COMMENT ON TABLE services IS 'Serviços descobertos no agregador de métricas.';
COMMENT ON COLUMN services.external_id IS 'Identificador estável recebido da API externa.';
COMMENT ON COLUMN services.status IS 'Estado atual do monitoramento do serviço.';
COMMENT ON TABLE collections IS 'Histórico imutável das coletas realizadas por serviço.';
COMMENT ON COLUMN collections.metrics IS 'Resposta bruta estruturada recebida na coleta.';
COMMENT ON TABLE users IS 'Usuários autorizados da área de configuração.';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt da senha; nunca armazena senha em texto puro.';

COMMIT;
