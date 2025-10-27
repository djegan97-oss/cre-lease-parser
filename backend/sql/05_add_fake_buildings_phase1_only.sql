-- Add fake building data and recalculate scores for Phase I only (max 21 points)

-- Add random building coverage (2% to 50%)
UPDATE parcel
SET 
    building_area_sqft = area_sqft * (0.02 + (random() * 0.48)),  -- Random 2-50%
    site_coverage_pct = (0.02 + (random() * 0.48)) * 100  -- Store as percentage
WHERE area_sqft IS NOT NULL AND area_sqft > 0;

-- Recalculate site coverage score with new data
UPDATE parcel
SET site_coverage_score = CASE 
    WHEN site_coverage_pct BETWEEN 1 AND 20 THEN 1
    ELSE 0
END
WHERE site_coverage_pct IS NOT NULL;

-- Update scoring function to ONLY use Phase I scores (max 21 points)
CREATE OR REPLACE FUNCTION calculate_parcel_score(parcel_id UUID)
RETURNS VOID AS $$
DECLARE
    total INT;
    percentage NUMERIC(5,2);
    grade VARCHAR(20);
BEGIN
    -- Sum ONLY Phase I scoring components (max 21 points)
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
        COALESCE(flood_zone_score, 0)
    INTO total
    FROM parcel
    WHERE id = parcel_id;
    
    -- Calculate percentage (max 21 points for Phase I)
    percentage := (total::NUMERIC / 21.0) * 100.0;
    
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

-- Recalculate all parcel scores with Phase I only
DO $$
DECLARE
    parcel_record RECORD;
BEGIN
    FOR parcel_record IN SELECT id FROM parcel LOOP
        PERFORM calculate_parcel_score(parcel_record.id);
    END LOOP;
END $$;
