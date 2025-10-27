-- Add size scoring and update existing scoring with zoning/population

-- Add site size score column
ALTER TABLE parcel ADD COLUMN IF NOT EXISTS site_size_score INTEGER DEFAULT 0 CHECK (site_size_score BETWEEN 0 AND 4);

-- Update max points calculation (now 39 instead of 35)
CREATE OR REPLACE FUNCTION calculate_parcel_score(parcel_id UUID)
RETURNS VOID AS $$
DECLARE
    total INT;
    percentage NUMERIC(5,2);
    grade VARCHAR(20);
BEGIN
    -- Sum all scoring components (max 39 points now with size)
    SELECT 
        COALESCE(supply_chain_score, 0) +
        COALESCE(industrial_nodes_score, 0) +
        COALESCE(population_score, 0) +
        COALESCE(heavy_zoning_score, 0) +
        COALESCE(site_size_score, 0) +
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
    
    -- Calculate percentage (max 39 points)
    percentage := (total::NUMERIC / 39.0) * 100.0;
    
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

-- Calculate site size, zoning, and population scores for existing parcels
UPDATE parcel
SET 
    -- Site Size: 1-5 ac = 4pts, 5-10 = 2pts, 11-14 = 1pt, 15+ = 0pts
    site_size_score = CASE 
        WHEN area_sqft BETWEEN 43560 AND 217800 THEN 4  -- 1-5 acres
        WHEN area_sqft BETWEEN 217801 AND 435600 THEN 2 -- 5-10 acres
        WHEN area_sqft BETWEEN 435601 AND 609840 THEN 1 -- 11-14 acres
        ELSE 0  -- <1 acre or >15 acres
    END,
    
    -- Heavy Zoning: M2/M3 = 3pts (by-right), M1 = 1pt (conditional)
    heavy_zoning_score = CASE 
        WHEN zoning_code IN ('M2', 'M3', 'M2-2', 'M2-3', 'M3-1', 'M3-2') THEN 3
        WHEN zoning_code IN ('M1', 'M1-1', 'M1-2') THEN 1
        ELSE 0
    END
WHERE area_sqft IS NOT NULL OR zoning_code IS NOT NULL;

-- Note: Population scoring requires Census API - will implement separately
-- For now, leaving population_score at 0

-- Recalculate total scores for all parcels
DO $$
DECLARE
    parcel_record RECORD;
BEGIN
    FOR parcel_record IN SELECT id FROM parcel LOOP
        PERFORM calculate_parcel_score(parcel_record.id);
    END LOOP;
END $$;
