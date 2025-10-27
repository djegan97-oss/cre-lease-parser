import { useState, useEffect } from 'react'
import Controls from './components/Controls'
import ParcelTable from './components/ParcelTable'
import Map from './components/Map'
import { Parcel, SearchFilters } from './types'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type SortField = 'address' | 'score' | 'zone_code' | 'lot_size_sqft'
type SortDirection = 'asc' | 'desc'

function App() {
  const [parcelList, setParcelList] = useState<Parcel[]>([])
  const [filteredParcels, setFilteredParcels] = useState<Parcel[]>([])
  const [sortedParcels, setSortedParcels] = useState<Parcel[]>([])
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [geoJsonFeatures, setGeoJsonFeatures] = useState<any[]>([])
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    address: '',
    ownerName: '',
    minScore: '',
    maxScore: '',
    minLotSizeAcres: '',
    maxLotSizeAcres: '',
    zoningType: '',
    minCoverage: '',
    maxCoverage: '',
    market: '',
    iosOnly: false,
  })

  // Fetch parcels on mount
  useEffect(() => {
    fetchParcels()
  }, [])

  // Sort parcels whenever filteredParcels or sort criteria change
  useEffect(() => {
    const sorted = [...filteredParcels].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (aVal === undefined || aVal === null) aVal = ''
      if (bVal === undefined || bVal === null) bVal = ''

      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    setSortedParcels(sorted)
  }, [filteredParcels, sortField, sortDirection])

  const fetchParcels = async () => {
    try {
      const response = await fetch(`${API_URL}/parcels/geojson?limit=500`)
      const data = await response.json()

      if (data.features) {
        setGeoJsonFeatures(data.features)

        // Transform features to parcel objects for table
        const parcels = data.features.map((feature: any) => ({
          id: feature.id,
          parcel_id: feature.properties.parcel_id,
          address: feature.properties.address,
          zone_code: feature.properties.zone_code,
          lot_size_sqft: feature.properties.lot_size_sqft,
          area_sqft: feature.properties.area_sqft,
          owner_name: feature.properties.owner_name,
          owner_type: feature.properties.owner_type,
          ios_flag: feature.properties.ios_flag,
          total_value: feature.properties.total_value,
          year_built: feature.properties.year_built,
          score: feature.properties.score,
        }))

        setParcelList(parcels)
        setFilteredParcels(parcels)
      }
    } catch (error) {
      console.error('Error fetching parcels:', error)
    }
  }

  const handleSearch = (newSearchFilters: SearchFilters) => {
    setSearchFilters(newSearchFilters)
    let filtered = [...parcelList]

    // Address filter
    if (newSearchFilters.address) {
      filtered = filtered.filter((p) =>
        p.address?.toLowerCase().includes(newSearchFilters.address.toLowerCase())
      )
    }

    // Owner name filter
    if (newSearchFilters.ownerName) {
      filtered = filtered.filter((p) =>
        p.owner_name?.toLowerCase().includes(newSearchFilters.ownerName.toLowerCase())
      )
    }

    // Score filters
    if (newSearchFilters.minScore) {
      const minScore = parseInt(newSearchFilters.minScore)
      filtered = filtered.filter((p) => (p.score || 0) >= minScore)
    }
    if (newSearchFilters.maxScore) {
      const maxScore = parseInt(newSearchFilters.maxScore)
      filtered = filtered.filter((p) => (p.score || 0) <= maxScore)
    }

    // Lot size filters (convert acres to sqft: 1 acre = 43,560 sqft)
    if (newSearchFilters.minLotSizeAcres) {
      const minSqft = parseFloat(newSearchFilters.minLotSizeAcres) * 43560
      filtered = filtered.filter((p) => (p.area_sqft || p.lot_size_sqft || 0) >= minSqft)
    }
    if (newSearchFilters.maxLotSizeAcres) {
      const maxSqft = parseFloat(newSearchFilters.maxLotSizeAcres) * 43560
      filtered = filtered.filter((p) => (p.area_sqft || p.lot_size_sqft || 0) <= maxSqft)
    }

    // Zoning type filter
    if (newSearchFilters.zoningType) {
      filtered = filtered.filter((p) => p.zone_code === newSearchFilters.zoningType)
    }

    // IOS only filter
    if (newSearchFilters.iosOnly) {
      filtered = filtered.filter((p) => p.ios_flag === true)
    }

    setFilteredParcels(filtered)
  }

  const handleClear = () => {
    const clearedFilters: SearchFilters = {
      address: '',
      ownerName: '',
      minScore: '',
      maxScore: '',
      minLotSizeAcres: '',
      maxLotSizeAcres: '',
      zoningType: '',
      minCoverage: '',
      maxCoverage: '',
      market: '',
      iosOnly: false,
    }
    setSearchFilters(clearedFilters)
    setFilteredParcels(parcelList)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  return (
    <div className="app-container">
      <div className="left-panel">
        <Controls filters={searchFilters} onSearch={handleSearch} onClear={handleClear} />
        <ParcelTable
          parcels={sortedParcels}
          selectedParcel={selectedParcel}
          onSelectParcel={setSelectedParcel}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>
      <div className="right-panel">
        <Map
          features={geoJsonFeatures}
          filteredParcels={sortedParcels}
          selectedParcel={selectedParcel}
          setSelectedParcel={setSelectedParcel}
        />
      </div>
    </div>
  )
}

export default App
