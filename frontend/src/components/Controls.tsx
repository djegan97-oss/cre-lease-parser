import { useState } from 'react'
import { SearchFilters } from '../types'
import './Controls.css'

interface ControlsProps {
  filters: SearchFilters
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
}

function Controls({ filters, onSearch, onClear }: ControlsProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)

  const handleInputChange = (field: keyof SearchFilters, value: string | boolean) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    onSearch(localFilters)
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
    setLocalFilters(clearedFilters)
    onClear()
  }

  return (
    <div className="controls-container">
      <h2 className="controls-title">Search Filters</h2>

      <div className="filters-grid">
        <div className="filter-group">
          <label>Address</label>
          <input
            type="text"
            placeholder="Search by address..."
            value={localFilters.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Owner Name</label>
          <input
            type="text"
            placeholder="Search by owner..."
            value={localFilters.ownerName}
            onChange={(e) => handleInputChange('ownerName', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Min Score</label>
          <input
            type="number"
            placeholder="0"
            value={localFilters.minScore}
            onChange={(e) => handleInputChange('minScore', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Max Score</label>
          <input
            type="number"
            placeholder="100"
            value={localFilters.maxScore}
            onChange={(e) => handleInputChange('maxScore', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Min Lot Size (acres)</label>
          <input
            type="number"
            step="0.1"
            placeholder="0"
            value={localFilters.minLotSizeAcres}
            onChange={(e) => handleInputChange('minLotSizeAcres', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Max Lot Size (acres)</label>
          <input
            type="number"
            step="0.1"
            placeholder="100"
            value={localFilters.maxLotSizeAcres}
            onChange={(e) => handleInputChange('maxLotSizeAcres', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Zoning Type</label>
          <select
            value={localFilters.zoningType}
            onChange={(e) => handleInputChange('zoningType', e.target.value)}
          >
            <option value="">All</option>
            <option value="M1">M1 - Light Manufacturing</option>
            <option value="M2">M2 - Heavy Manufacturing</option>
            <option value="M3">M3 - Industrial</option>
            <option value="I">I - Industrial</option>
            <option value="C">C - Commercial</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Min Site Coverage (%)</label>
          <input
            type="number"
            step="1"
            placeholder="0"
            value={localFilters.minCoverage}
            onChange={(e) => handleInputChange('minCoverage', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Max Site Coverage (%)</label>
          <input
            type="number"
            step="1"
            placeholder="100"
            value={localFilters.maxCoverage}
            onChange={(e) => handleInputChange('maxCoverage', e.target.value)}
          />
        </div>

        <div className="filter-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={localFilters.iosOnly}
              onChange={(e) => handleInputChange('iosOnly', e.target.checked)}
            />
            IOS Eligible Only
          </label>
        </div>
      </div>

      <div className="button-group">
        <button className="btn-search" onClick={handleSearch}>
          Search
        </button>
        <button className="btn-clear" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  )
}

export default Controls
