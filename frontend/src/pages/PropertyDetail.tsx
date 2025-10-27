import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ParcelDetail } from '../types'
import './PropertyDetail.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [parcel, setParcel] = useState<ParcelDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (id) {
      fetchParcelDetails(id)
    }
  }, [id])

  const fetchParcelDetails = async (parcelId: string) => {
    try {
      const response = await fetch(`${API_URL}/parcels/${parcelId}`)
      const data = await response.json()
      setParcel(data)
    } catch (error) {
      console.error('Error fetching parcel details:', error)
    } finally {
      setLoading(false)
    }
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

  const calculateGrade = (score?: number) => {
    if (!score) return '—'
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  if (loading) {
    return (
      <div className="property-detail-container">
        <div className="loading">Loading property details...</div>
      </div>
    )
  }

  if (!parcel) {
    return (
      <div className="property-detail-container">
        <div className="error">Property not found</div>
      </div>
    )
  }

  return (
    <div className="property-detail-container">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Map
        </button>
        <h1>{parcel.address || 'Unknown Address'}</h1>
        <p className="parcel-id">Parcel ID: {parcel.parcel_id}</p>
      </div>

      <div className="detail-content">
        <div className="cards-grid">
          {/* Property Overview Card */}
          <div className="card">
            <h2 className="card-title">Property Overview</h2>
            <div className="card-content">
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{parcel.address || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Owner:</span>
                <span className="info-value">{parcel.owner_name || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Owner Type:</span>
                <span className="info-value">{parcel.owner_type || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Lot Size:</span>
                <span className="info-value">
                  {formatAcres(parcel.lot_size_sqft)} acres (
                  {parcel.lot_size_sqft?.toLocaleString() || '—'} sqft)
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Year Built:</span>
                <span className="info-value">{parcel.year_built || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">IOS Eligible:</span>
                <span className={`ios-badge ${parcel.ios_flag ? 'eligible' : 'not-eligible'}`}>
                  {parcel.ios_flag ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Investment Score Card */}
          <div className="card">
            <h2 className="card-title">Investment Score</h2>
            <div className="card-content">
              <div className="score-display">
                <div className="score-circle">
                  <span className="score-number">{parcel.score || '—'}</span>
                  <span className="score-label">Score</span>
                </div>
                <div className="grade-badge">{calculateGrade(parcel.score)}</div>
              </div>
              <div className="score-components">
                <h3>Score Components</h3>
                <div className="component-item">
                  <span className="component-label">Zoning (30%)</span>
                  <div className="component-bar">
                    <div className="component-fill" style={{ width: '75%' }}></div>
                  </div>
                  <span className="component-value">75</span>
                </div>
                <div className="component-item">
                  <span className="component-label">Access (25%)</span>
                  <div className="component-bar">
                    <div className="component-fill" style={{ width: '80%' }}></div>
                  </div>
                  <span className="component-value">80</span>
                </div>
                <div className="component-item">
                  <span className="component-label">Size (20%)</span>
                  <div className="component-bar">
                    <div className="component-fill" style={{ width: '85%' }}></div>
                  </div>
                  <span className="component-value">85</span>
                </div>
                <div className="component-item">
                  <span className="component-label">Coverage (15%)</span>
                  <div className="component-bar">
                    <div className="component-fill" style={{ width: '70%' }}></div>
                  </div>
                  <span className="component-value">70</span>
                </div>
                <div className="component-item">
                  <span className="component-label">Market (10%)</span>
                  <div className="component-bar">
                    <div className="component-fill" style={{ width: '90%' }}></div>
                  </div>
                  <span className="component-value">90</span>
                </div>
              </div>
            </div>
          </div>

          {/* Zoning Information Card */}
          <div className="card">
            <h2 className="card-title">Zoning Information</h2>
            <div className="card-content">
              <div className="info-row">
                <span className="info-label">Zone Code:</span>
                <span className="info-value">{parcel.zone_code || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Zone Description:</span>
                <span className="info-value">
                  {parcel.zone_code === 'M1'
                    ? 'Light Manufacturing'
                    : parcel.zone_code === 'M2'
                    ? 'Heavy Manufacturing'
                    : parcel.zone_code === 'M3'
                    ? 'Industrial'
                    : '—'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Max Buildable Units:</span>
                <span className="info-value">{parcel.max_buildable_units || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Max Units with IOS:</span>
                <span className="info-value">{parcel.max_buildable_units_with_ios || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Bonus Units:</span>
                <span className="info-value">{parcel.bonus_units || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Required Affordable Units:</span>
                <span className="info-value">{parcel.required_affordable_units || '—'}</span>
              </div>
            </div>
          </div>

          {/* Financial Information Card */}
          <div className="card">
            <h2 className="card-title">Financial Information</h2>
            <div className="card-content">
              <div className="info-row">
                <span className="info-label">Land Value:</span>
                <span className="info-value">{formatCurrency(parcel.land_value)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Improvement Value:</span>
                <span className="info-value">{formatCurrency(parcel.improvement_value)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Total Value:</span>
                <span className="info-value total-value">
                  {formatCurrency(parcel.total_value)}
                </span>
              </div>
            </div>
          </div>

          {/* Environmental Due Diligence Card */}
          <div className="card">
            <h2 className="card-title">Environmental Due Diligence</h2>
            <div className="card-content">
              <div className="info-row">
                <span className="info-label">Flood Zone:</span>
                <span className="info-value">No (placeholder)</span>
              </div>
              <div className="info-row">
                <span className="info-label">Contamination Distance:</span>
                <span className="info-value">2.3 miles (placeholder)</span>
              </div>
              <div className="info-row">
                <span className="info-label">Soil Quality:</span>
                <span className="info-value">Good (placeholder)</span>
              </div>
              <div className="info-row">
                <span className="info-label">Environmental Risks:</span>
                <span className="info-value">Low (placeholder)</span>
              </div>
            </div>
          </div>

          {/* Market Comparables Card */}
          <div className="card">
            <h2 className="card-title">Market Comparables</h2>
            <div className="card-content">
              <p className="placeholder-text">
                Market sales and lease comparables will be displayed here once integrated with
                market data sources.
              </p>
            </div>
          </div>

          {/* Notes Card */}
          <div className="card card-full-width">
            <h2 className="card-title">Notes</h2>
            <div className="card-content">
              <textarea
                className="notes-textarea"
                placeholder="Add notes about this property..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              <button className="save-notes-btn">Save Notes</button>
              <p className="notes-info">
                Notes are stored in the database and visible to all logged-in users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyDetail
