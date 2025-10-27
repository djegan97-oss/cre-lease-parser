-- Add team scoring rubric columns (35-point system)

-- Phase I scores (public data - max 17 points without industrial nodes)
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS supply_chain_score INTEGER DEFAULT 0 CHECK (supply_chain_score BETWEEN 0 AND 3);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS industrial_nodes_score INTEGER DEFAULT 0 CHECK (industrial_nodes_score BETWEEN 0 AND 2);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS population_score INTEGER DEFAULT 0 CHECK (population_score BETWEEN 0 AND 2);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS heavy_zoning_score INTEGER DEFAULT 0 CHECK (heavy_zoning_score BETWEEN 0 AND 3);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS interstate_score INTEGER DEFAULT 0 CHECK (interstate_score BETWEEN 0 AND 3);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS site_config_score INTEGER DEFAULT 0 CHECK (site_config_score BETWEEN 0 AND 1);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS site_coverage_score INTEGER DEFAULT 0 CHECK (site_coverage_score BETWEEN 0 AND 1);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS environmental_score INTEGER DEFAULT 0 CHECK (environmental_score BETWEEN 0 AND 1);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS flood_zone_score INTEGER DEFAULT 0 CHECK (flood_zone_score BETWEEN 0 AND 1);

-- Phase II scores (manual/private data - max 18 points)
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS site_access_score INTEGER DEFAULT 0 CHECK (site_access_score BETWEEN 0 AND 2);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS yard_score INTEGER DEFAULT 0 CHECK (yard_score BETWEEN 0 AND 2);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS fence_score INTEGER DEFAULT 0 CHECK (fence_score BETWEEN 0 AND 1);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS lighting_score INTEGER DEFAULT 0 CHECK (lighting_score BETWEEN 0 AND 1);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS building_score INTEGER DEFAULT 0 CHECK (building_score BETWEEN 0 AND 4);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS tenant_score INTEGER DEFAULT 0 CHECK (tenant_score BETWEEN 0 AND 3);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS walt_score INTEGER DEFAULT 0 CHECK (walt_score BETWEEN 0 AND 2);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS mark_to_market_score INTEGER DEFAULT 0 CHECK (mark_to_market_score BETWEEN 0 AND 3);

-- Calculated fields
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0;
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS score_percentage NUMERIC(5,2) DEFAULT 0;
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS score_grade VARCHAR(20);

-- Distance/metrics for scoring calculations
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS nearest_airport_mi NUMERIC(6,2);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS nearest_port_mi NUMERIC(6,2);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS nearest_intermodal_mi NUMERIC(6,2);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS nearest_interstate_mi NUMERIC(6,2);
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS population_5mi INTEGER;
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS rectangularity_ratio NUMERIC(5,2);

-- Indexes for scoring queries
CREATE INDEX IF NOT EXISTS idx_parcel_total_score ON parcel(total_score);
CREATE INDEX IF NOT EXISTS idx_parcel_score_percentage ON parcel(score_percentage);
CREATE INDEX IF NOT EXISTS idx_parcel_score_grade ON parcel(score_grade);

-- Function to calculate total score and grade
CREATE OR REPLACE FUNCTION calculate_parcel_score(parcel_id UUID)
RETURNS VOID AS $$
DECLARE
    total INT;
    percentage NUMERIC(5,2);
    grade VARCHAR(20);
BEGIN
    -- Sum all scoring components
    SELECT 
        COALESCE(supply_chain_score, 0) +
        COALESCE(industrial_nodes_score, 0) +
        COALESCE(population_score, 0) +
        COALESCE(heavy_zoning_score, 0) +
        COALESCE(interstate_score, 0) +
        COALESCE(site_config_score, 0) +
        COALESCE(site_coverage_score, 0) +
        COALESCE(environmental_score, 0) +
        COALESCE(flood_zone_score, 0) +
        COALESCE(site_access_score, 0) +
        COALESCE(yard_score, 0) +
        COALESCE(fence_score, 0) +
        COALESCE(lighting_score, 0) +
        COALESCE(building_score, 0) +
        COALESCE(tenant_score, 0) +
        COALESCE(walt_score, 0) +
        COALESCE(mark_to_market_score, 0)
    INTO total
    FROM parcel
    WHERE id = parcel_id;
    
    -- Calculate percentage (max 35 points)
    percentage := (total::NUMERIC / 35.0) * 100.0;
    
    -- Determine grade
    IF percentage >= 75 THEN
        grade := 'Great Site';
    ELSIF percentage >= 50 THEN
        grade := 'Good Site';
    ELSE
        grade := 'Challenged Site';
    END IF;
    
    -- Update parcel
    UPDATE parcel
    SET 
        total_score = total,
        score_percentage = percentage,
        score_grade = grade
    WHERE id = parcel_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate site configuration score (rectangularity)
CREATE OR REPLACE FUNCTION calculate_site_config_score(geom geometry)
RETURNS INTEGER AS $$
DECLARE
    bbox_area NUMERIC;
    actual_area NUMERIC;
    rectangularity NUMERIC;
BEGIN
    -- Get area of bounding box
    bbox_area := ST_Area(ST_Envelope(geom)::geography);
    
    -- Get actual area
    actual_area := ST_Area(geom::geography);
    
    -- Calculate rectangularity ratio (1.0 = perfect rectangle)
    IF bbox_area > 0 THEN
        rectangularity := actual_area / bbox_area;
        
        -- If ratio > 0.85, shape is rectangular enough
        IF rectangularity >= 0.85 THEN
            RETURN 1;
        ELSE
            RETURN 0;
        END IF;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Calculate scores for existing parcels that we can compute now
UPDATE parcel
SET 
    -- Site Coverage: 1-20% = 1 pt, else 0
    site_coverage_score = CASE 
        WHEN site_coverage_pct BETWEEN 1 AND 20 THEN 1
        ELSE 0
    END,
    
    -- Environmental: No contamination nearby = 1 pt
    environmental_score = CASE 
        WHEN nearest_contamination_mi IS NULL OR nearest_contamination_mi > 1.0 THEN 1
        ELSE 0
    END,
    
    -- Flood Zone: Outside SFHA = 1 pt
    flood_zone_score = CASE 
        WHEN in_flood_zone = FALSE THEN 1
        ELSE 0
    END,
    
    -- Site Configuration: Calculate rectangularity
    site_config_score = calculate_site_config_score(geometry),
    rectangularity_ratio = ST_Area(geometry::geography) / NULLIF(ST_Area(ST_Envelope(geometry)::geography), 0)
WHERE geometry IS NOT NULL;

-- Recalculate total scores for all parcels
DO $$
DECLARE
    parcel_record RECORD;
BEGIN
    FOR parcel_record IN SELECT id FROM parcel LOOP
        PERFORM calculate_parcel_score(parcel_record.id);
    END LOOP;
END $$;
