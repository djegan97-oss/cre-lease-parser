"""
Parcel SQLAlchemy model
"""
from sqlalchemy import Column, Integer, String, Numeric, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry
from backend.app.database import Base

class Parcel(Base):
    __tablename__ = "parcel"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(String(100), unique=True, nullable=False)
    jurisdiction_id = Column(Integer, ForeignKey("jurisdiction.id"))

    # Geometry
    geom = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)
    centroid = Column(Geometry('POINT', srid=4326))

    # Zoning
    zone_code = Column(String(50))
    ios_ruleset_id = Column(Integer, ForeignKey("ios_ruleset.id"))

    # Parcel attributes
    address = Column(String(500))
    lot_size_sqft = Column(Numeric(12, 2))
    land_value = Column(Numeric(15, 2))
    improvement_value = Column(Numeric(15, 2))
    total_value = Column(Numeric(15, 2))
    year_built = Column(Integer)
    market = Column(String(255))

    # Ownership
    owner_name = Column(String(500))
    owner_type = Column(String(50))

    # IOS analysis
    ios_eligible = Column(Boolean, default=False)
    max_buildable_units = Column(Integer)
    max_buildable_units_with_ios = Column(Integer)
    bonus_units = Column(Integer)
    required_affordable_units = Column(Integer)

    # Metadata
    data_source = Column(String(100))
    last_updated = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP)
