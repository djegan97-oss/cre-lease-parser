"""
Load sample parcel data into the database for testing
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ios_zoning")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def load_sample_parcels():
    """Load sample parcel data with realistic geometries in Los Angeles area"""

    session = SessionLocal()

    try:
        # Sample parcels in downtown Los Angeles area
        sample_parcels = [
            {
                'parcel_id': 'LA-001-2024',
                'address': '123 Industrial Blvd, Los Angeles, CA 90021',
                'zone_code': 'M2',
                'lot_size_sqft': 217800,  # 5 acres
                'owner_name': 'ABC Industrial Properties LLC',
                'owner_type': 'corporate',
                'ios_eligible': True,
                'total_value': 8500000,
                'land_value': 6000000,
                'improvement_value': 2500000,
                'year_built': 1995,
                'geom': 'SRID=4326;MULTIPOLYGON(((-118.245 34.035, -118.244 34.035, -118.244 34.034, -118.245 34.034, -118.245 34.035)))'
            },
            {
                'parcel_id': 'LA-002-2024',
                'address': '456 Manufacturing Way, Los Angeles, CA 90021',
                'zone_code': 'M1',
                'lot_size_sqft': 130680,  # 3 acres
                'owner_name': 'XYZ Logistics Inc',
                'owner_type': 'corporate',
                'ios_eligible': True,
                'total_value': 5200000,
                'land_value': 3900000,
                'improvement_value': 1300000,
                'year_built': 2005,
                'geom': 'SRID=4326;MULTIPOLYGON(((-118.243 34.035, -118.242 34.035, -118.242 34.034, -118.243 34.034, -118.243 34.035)))'
            },
            {
                'parcel_id': 'LA-003-2024',
                'address': '789 Commerce St, Los Angeles, CA 90058',
                'zone_code': 'M3',
                'lot_size_sqft': 261360,  # 6 acres
                'owner_name': 'Smith Family Trust',
                'owner_type': 'individual',
                'ios_eligible': False,
                'total_value': 9800000,
                'land_value': 7500000,
                'improvement_value': 2300000,
                'year_built': 1988,
                'geom': 'SRID=4326;MULTIPOLYGON(((-118.241 34.035, -118.240 34.035, -118.240 34.034, -118.241 34.034, -118.241 34.035)))'
            },
            {
                'parcel_id': 'LA-004-2024',
                'address': '321 Storage Ave, Los Angeles, CA 90058',
                'zone_code': 'M2',
                'lot_size_sqft': 174240,  # 4 acres
                'owner_name': 'Pacific Storage Holdings',
                'owner_type': 'corporate',
                'ios_eligible': True,
                'total_value': 6700000,
                'land_value': 5000000,
                'improvement_value': 1700000,
                'year_built': 2010,
                'geom': 'SRID=4326;MULTIPOLYGON(((-118.245 34.033, -118.244 34.033, -118.244 34.032, -118.245 34.032, -118.245 34.033)))'
            },
            {
                'parcel_id': 'LA-005-2024',
                'address': '555 Warehouse Rd, Los Angeles, CA 90021',
                'zone_code': 'M1',
                'lot_size_sqft': 87120,   # 2 acres
                'owner_name': 'Green Valley Properties',
                'owner_type': 'corporate',
                'ios_eligible': False,
                'total_value': 3400000,
                'land_value': 2600000,
                'improvement_value': 800000,
                'year_built': 2015,
                'geom': 'SRID=4326;MULTIPOLYGON(((-118.243 34.033, -118.242 34.033, -118.242 34.032, -118.243 34.032, -118.243 34.033)))'
            },
            {
                'parcel_id': 'LA-006-2024',
                'address': '888 Distribution Dr, Los Angeles, CA 90058',
                'zone_code': 'M3',
                'lot_size_sqft': 304920,  # 7 acres
                'owner_name': 'Johnson Enterprises',
                'owner_type': 'corporate',
                'ios_eligible': True,
                'total_value': 11500000,
                'land_value': 8500000,
                'improvement_value': 3000000,
                'year_built': 2000,
                'geom': 'SRID=4326;MULTIPOLYGON(((-118.241 34.033, -118.240 34.033, -118.240 34.032, -118.241 34.032, -118.241 34.033)))'
            },
            {
                'parcel_id': 'LA-007-2024',
                'address': '999 Freight Ln, Los Angeles, CA 90021',
                'zone_code': 'M2',
                'lot_size_sqft': 152460,  # 3.5 acres
                'owner_name': 'Metro Industrial Fund',
                'owner_type': 'corporate',
                'ios_eligible': True,
                'total_value': 5900000,
                'land_value': 4500000,
                'improvement_value': 1400000,
                'year_built': 2008,
                'geom': 'SRID=4326;MULTIPOLYGON(((-118.245 34.031, -118.244 34.031, -118.244 34.030, -118.245 34.030, -118.245 34.031)))'
            },
            {
                'parcel_id': 'LA-008-2024',
                'address': '111 Terminal Way, Los Angeles, CA 90058',
                'zone_code': 'M1',
                'lot_size_sqft': 196020,  # 4.5 acres
                'owner_name': 'Coastal Development Corp',
                'owner_type': 'corporate',
                'ios_eligible': False,
                'total_value': 7200000,
                'land_value': 5500000,
                'improvement_value': 1700000,
                'year_built': 1998,
                'geom': 'SRID=4326;MULTIPOLYGON(((-118.243 34.031, -118.242 34.031, -118.242 34.030, -118.243 34.030, -118.243 34.031)))'
            },
            {
                'parcel_id': 'LA-009-2024',
                'address': '222 Container St, Los Angeles, CA 90021',
                'zone_code': 'M3',
                'lot_size_sqft': 239580,  # 5.5 acres
                'owner_name': 'Williams Industrial Partners',
                'owner_type': 'corporate',
                'ios_eligible': True,
                'total_value': 9100000,
                'land_value': 7000000,
                'improvement_value': 2100000,
                'year_built': 2012,
                'geom': 'SRID=4326;MULTIPOLYGON(((-118.241 34.031, -118.240 34.031, -118.240 34.030, -118.241 34.030, -118.241 34.031)))'
            },
            {
                'parcel_id': 'LA-010-2024',
                'address': '333 Loading Dock Blvd, Los Angeles, CA 90058',
                'zone_code': 'M2',
                'lot_size_sqft': 108900,  # 2.5 acres
                'owner_name': 'Harbor View Holdings',
                'owner_type': 'corporate',
                'ios_eligible': True,
                'total_value': 4300000,
                'land_value': 3300000,
                'improvement_value': 1000000,
                'year_built': 2018,
                'geom': 'SRID=4326;MULTIPOLYGON(((-118.245 34.029, -118.244 34.029, -118.244 34.028, -118.245 34.028, -118.245 34.029)))'
            },
        ]

        # Insert parcels
        for parcel_data in sample_parcels:
            # Calculate centroid from geometry
            sql = text("""
                INSERT INTO parcel (
                    parcel_id, address, zone_code, lot_size_sqft,
                    owner_name, owner_type, ios_eligible,
                    total_value, land_value, improvement_value, year_built,
                    geom, centroid, data_source, last_updated, created_at
                ) VALUES (
                    :parcel_id, :address, :zone_code, :lot_size_sqft,
                    :owner_name, :owner_type, :ios_eligible,
                    :total_value, :land_value, :improvement_value, :year_built,
                    ST_GeomFromEWKT(:geom),
                    ST_Centroid(ST_GeomFromEWKT(:geom)),
                    'sample_data',
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
            """)

            session.execute(sql, parcel_data)

        session.commit()
        print(f"✓ Successfully loaded {len(sample_parcels)} sample parcels")

        # Display summary
        result = session.execute(text("SELECT COUNT(*) FROM parcel"))
        total_count = result.scalar()
        print(f"✓ Total parcels in database: {total_count}")

    except Exception as e:
        session.rollback()
        print(f"✗ Error loading sample data: {e}")
        raise
    finally:
        session.close()

if __name__ == '__main__':
    print("Loading sample parcel data...")
    load_sample_parcels()
