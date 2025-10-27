import { useNavigate } from 'react-router-dom'
import { Parcel } from '../types'
import './ParcelTable.css'

interface ParcelTableProps {
  parcels: Parcel[]
  selectedParcel: Parcel | null
  onSelectParcel: (parcel: Parcel) => void
  sortField: 'address' | 'score' | 'zone_code' | 'lot_size_sqft'
  sortDirection: 'asc' | 'desc'
  onSort: (field: 'address' | 'score' | 'zone_code' | 'lot_size_sqft') => void
}

function ParcelTable({ parcels, selectedParcel, onSelectParcel, sortField, sortDirection, onSort }: ParcelTableProps) {
  const navigate = useNavigate()

  const handleRowClick = (parcel: Parcel, e: React.MouseEvent) => {
    // Don't select if clicking the View button
    if ((e.target as HTMLElement).classList.contains('view-details-btn')) {
      return
    }
    onSelectParcel(parcel)
  }

  const handleViewDetails = (parcel: Parcel, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/property/${parcel.id}`)
  }

  const formatAcres = (sqft?: number) => {
    if (!sqft) return '—'
    const acres = sqft / 43560
    return acres.toFixed(2)
  }

  const formatCurrency = (value?: number) => {
    if (!value) return '—'
    return '$' + (value / 1000000).toFixed(2) + 'M'
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Properties ({parcels.length})</h3>
      </div>
      <div className="table-wrapper">
        <table className="parcel-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => onSort('score')}>
                #/Score {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="sortable" onClick={() => onSort('address')}>
                Address {sortField === 'address' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="sortable" onClick={() => onSort('zone_code')}>
                Zoning {sortField === 'zone_code' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="sortable" onClick={() => onSort('lot_size_sqft')}>
                Lot Size (acres){' '}
                {sortField === 'lot_size_sqft' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Value</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((parcel, index) => (
              <tr
                key={parcel.id}
                className={selectedParcel?.id === parcel.id ? 'selected' : ''}
                onClick={(e) => handleRowClick(parcel, e)}
              >
                <td>
                  <div className="score-cell">
                    <div className="row-number">{index + 1}</div>
                    <div
                      className="score-badge"
                      style={{
                        background: parcel.ios_flag ? '#3b82f6' : '#94a3b8',
                      }}
                    >
                      {parcel.score || '—'}
                    </div>
                  </div>
                </td>
                <td className="address-cell">{parcel.address || 'Unknown'}</td>
                <td>{parcel.zone_code || '—'}</td>
                <td>{formatAcres(parcel.lot_size_sqft || parcel.area_sqft)}</td>
                <td>{formatCurrency(parcel.total_value)}</td>
                <td>
                  <button
                    className="view-details-btn"
                    onClick={(e) => handleViewDetails(parcel, e)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {parcels.length === 0 && (
          <div className="empty-state">
            <p>No properties match your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ParcelTable
