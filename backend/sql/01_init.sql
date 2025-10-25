-- IOS Zoning MVP Database Schema
-- PostGIS-enabled schema for parcels, jurisdictions, and IOS rulesets

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Jurisdiction table (markets/cities)
CREATE TABLE IF NOT EXISTS jurisdiction (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    state_code VARCHAR(2),
    geom GEOMETRY(MULTIPOLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jurisdiction_geom ON jurisdiction USING GIST(geom);

-- IOS Ruleset table (zoning rules by jurisdiction)
CREATE TABLE IF NOT EXISTS ios_ruleset (
    id SERIAL PRIMARY KEY,
    jurisdiction_id INTEGER REFERENCES jurisdiction(id) ON DELETE CASCADE,
    zone_code VARCHAR(50) NOT NULL,
    zone_name VARCHAR(255),
    ios_enabled BOOLEAN DEFAULT FALSE,

    -- IOS Requirements
    min_units INTEGER,
    min_affordable_pct DECIMAL(5,2),
    affordability_levels JSONB, -- e.g., [{"ami_pct": 60, "unit_pct": 20}]

    -- Incentives
    density_bonus_pct DECIMAL(5,2),
    height_bonus_ft DECIMAL(8,2),
    far_bonus DECIMAL(5,2),
    parking_reduction_pct DECIMAL(5,2),
    fee_waivers JSONB,

    -- Other attributes
    min_lot_size_sqft INTEGER,
    base_far DECIMAL(5,2),
    base_height_ft DECIMAL(8,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(jurisdiction_id, zone_code)
);

CREATE INDEX idx_ios_ruleset_jurisdiction ON ios_ruleset(jurisdiction_id);
CREATE INDEX idx_ios_ruleset_zone ON ios_ruleset(zone_code);

-- Parcel table (land parcels with ownership and zoning)
CREATE TABLE IF NOT EXISTS parcel (
    id SERIAL PRIMARY KEY,
    parcel_id VARCHAR(100) NOT NULL UNIQUE,
    jurisdiction_id INTEGER REFERENCES jurisdiction(id) ON DELETE CASCADE,

    -- Geometry
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    centroid GEOMETRY(POINT, 4326),

    -- Zoning
    zone_code VARCHAR(50),
    ios_ruleset_id INTEGER REFERENCES ios_ruleset(id) ON DELETE SET NULL,

    -- Parcel attributes
    address VARCHAR(500),
    lot_size_sqft DECIMAL(12,2),
    land_value DECIMAL(15,2),
    improvement_value DECIMAL(15,2),
    total_value DECIMAL(15,2),
    year_built INTEGER,

    -- Ownership
    owner_name VARCHAR(500),
    owner_type VARCHAR(50), -- 'individual', 'corporate', 'government', etc.

    -- IOS analysis (computed)
    ios_eligible BOOLEAN DEFAULT FALSE,
    max_buildable_units INTEGER,
    max_buildable_units_with_ios INTEGER,
    bonus_units INTEGER,
    required_affordable_units INTEGER,

    -- Metadata
    data_source VARCHAR(100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parcel_geom ON parcel USING GIST(geom);
CREATE INDEX idx_parcel_centroid ON parcel USING GIST(centroid);
CREATE INDEX idx_parcel_jurisdiction ON parcel(jurisdiction_id);
CREATE INDEX idx_parcel_zone ON parcel(zone_code);
CREATE INDEX idx_parcel_ios_eligible ON parcel(ios_eligible);
CREATE INDEX idx_parcel_lot_size ON parcel(lot_size_sqft);
CREATE INDEX idx_parcel_value ON parcel(total_value);

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jurisdiction_updated_at BEFORE UPDATE ON jurisdiction
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ios_ruleset_updated_at BEFORE UPDATE ON ios_ruleset
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parcel_updated_at BEFORE UPDATE ON parcel
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to compute parcel centroid automatically
CREATE OR REPLACE FUNCTION update_parcel_centroid()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.geom IS NOT NULL THEN
        NEW.centroid = ST_Centroid(NEW.geom);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compute_parcel_centroid BEFORE INSERT OR UPDATE ON parcel
    FOR EACH ROW EXECUTE FUNCTION update_parcel_centroid();
