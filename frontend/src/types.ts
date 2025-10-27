export interface Parcel {
  id: number
  parcel_id: string
  address?: string
  zone_code?: string
  lot_size_sqft?: number
  area_sqft?: number  // Alias for lot_size_sqft
  owner_name?: string
  owner_type?: string
  ios_flag?: boolean
  total_value?: number
  year_built?: number
  score?: number
}

export interface ParcelDetail extends Parcel {
  land_value?: number
  improvement_value?: number
  max_buildable_units?: number
  max_buildable_units_with_ios?: number
  bonus_units?: number
  required_affordable_units?: number
  data_source?: string
}

export interface SearchFilters {
  address: string
  ownerName: string
  minScore: string
  maxScore: string
  minLotSizeAcres: string
  maxLotSizeAcres: string
  zoningType: string
  minCoverage: string
  maxCoverage: string
  market: string
  iosOnly: boolean
}

export interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
}
