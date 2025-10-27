"""
Parcel API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.app.database import get_db
from backend.models.parcel import Parcel
from geoalchemy2.functions import ST_AsGeoJSON
import json

router = APIRouter()

class ParcelResponse(BaseModel):
    id: int
    parcel_id: str
    address: Optional[str]
    zone_code: Optional[str]
    lot_size_sqft: Optional[float]
    owner_name: Optional[str]
    owner_type: Optional[str]
    ios_eligible: Optional[bool]
    total_value: Optional[float]
    year_built: Optional[int]

    class Config:
        from_attributes = True

class ParcelDetailResponse(ParcelResponse):
    land_value: Optional[float]
    improvement_value: Optional[float]
    max_buildable_units: Optional[int]
    max_buildable_units_with_ios: Optional[int]
    bonus_units: Optional[int]
    required_affordable_units: Optional[int]
    data_source: Optional[str]

@router.get("/geojson")
async def get_parcels_geojson(
    db: Session = Depends(get_db),
    market: Optional[str] = None,
    ios_only: bool = False,
    limit: int = 500
):
    """
    Get parcels as GeoJSON FeatureCollection
    """
    query = db.query(
        Parcel.id,
        Parcel.parcel_id,
        Parcel.address,
        Parcel.zone_code,
        Parcel.lot_size_sqft,
        Parcel.owner_name,
        Parcel.owner_type,
        Parcel.ios_eligible,
        Parcel.total_value,
        Parcel.year_built,
        Parcel.market,
        ST_AsGeoJSON(Parcel.geom).label('geojson')
    )

    if ios_only:
        query = query.filter(Parcel.ios_eligible == True)

    if market:
        query = query.filter(Parcel.market == market)

    query = query.limit(limit)
    results = query.all()

    features = []
    for row in results:
        geometry = json.loads(row.geojson) if row.geojson else None

        feature = {
            "type": "Feature",
            "id": row.id,
            "geometry": geometry,
            "properties": {
                "id": row.id,
                "parcel_id": row.parcel_id,
                "address": row.address,
                "zone_code": row.zone_code,
                "lot_size_sqft": float(row.lot_size_sqft) if row.lot_size_sqft else None,
                "area_sqft": float(row.lot_size_sqft) if row.lot_size_sqft else None,  # Alias
                "owner_name": row.owner_name,
                "owner_type": row.owner_type,
                "ios_flag": row.ios_eligible,
                "total_value": float(row.total_value) if row.total_value else None,
                "year_built": row.year_built,
                "market": row.market,
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/{parcel_id}", response_model=ParcelDetailResponse)
async def get_parcel_detail(
    parcel_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a single parcel
    """
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()

    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    return parcel

@router.get("/", response_model=List[ParcelResponse])
async def list_parcels(
    skip: int = 0,
    limit: int = 100,
    ios_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    List parcels with pagination
    """
    query = db.query(Parcel)

    if ios_only:
        query = query.filter(Parcel.ios_eligible == True)

    parcels = query.offset(skip).limit(limit).all()
    return parcels
