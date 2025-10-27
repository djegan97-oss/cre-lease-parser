import { useRef, useEffect } from 'react'
import maplibregl from 'maplibre-gl'
import { Parcel } from '../types'
import './Map.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface MapProps {
  features: any[]
  filteredParcels: Parcel[]
  selectedParcel: Parcel | null
  setSelectedParcel: (parcel: Parcel) => void
}

function Map({ features, filteredParcels, selectedParcel, setSelectedParcel }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const mapLoaded = useRef(false)
  const markers = useRef<maplibregl.Marker[]>([])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [-118.2437, 34.0522], // Los Angeles default
      zoom: 11,
    })

    map.current.on('load', () => {
      mapLoaded.current = true
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        mapLoaded.current = false
      }
    }
  }, [])

  // Add parcel polygons layer
  useEffect(() => {
    if (!map.current || !mapLoaded.current || features.length === 0) return

    const currentMap = map.current

    // Remove existing parcel layers if they exist
    if (currentMap.getLayer('parcels-fill')) {
      currentMap.removeLayer('parcels-fill')
    }
    if (currentMap.getLayer('parcels-outline')) {
      currentMap.removeLayer('parcels-outline')
    }
    if (currentMap.getSource('parcels')) {
      currentMap.removeSource('parcels')
    }

    // Add parcel source
    currentMap.addSource('parcels', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features,
      },
    })

    // Add fill layer
    currentMap.addLayer({
      id: 'parcels-fill',
      type: 'fill',
      source: 'parcels',
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'ios_flag'], true],
          '#3b82f6', // Blue for IOS eligible
          '#94a3b8', // Gray for others
        ],
        'fill-opacity': 0.3,
      },
    })

    // Add outline layer
    currentMap.addLayer({
      id: 'parcels-outline',
      type: 'line',
      source: 'parcels',
      paint: {
        'line-color': '#1e293b',
        'line-width': 1,
        'line-opacity': 0.5,
      },
    })

    // Fit bounds to show all parcels
    if (features.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      features.forEach((feature) => {
        if (feature.geometry && feature.geometry.coordinates) {
          const coords = feature.geometry.coordinates[0]
          if (coords && coords.length > 0) {
            coords.forEach((coord: number[]) => {
              bounds.extend([coord[0], coord[1]])
            })
          }
        }
      })
      currentMap.fitBounds(bounds, { padding: 50 })
    }
  }, [features])

  // Add numbered markers for filtered parcels
  useEffect(() => {
    if (!map.current || !mapLoaded.current) return

    const currentMap = map.current

    // Remove existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    // Add markers for filtered parcels
    filteredParcels.forEach((parcel, index) => {
      // Find the feature to get the centroid
      const feature = features.find((f) => f.id === parcel.id)
      if (!feature || !feature.geometry) return

      // Calculate centroid
      let centerLng = 0
      let centerLat = 0
      let count = 0

      const coords = feature.geometry.coordinates[0]
      if (coords && coords.length > 0) {
        coords.forEach((coord: number[]) => {
          centerLng += coord[0]
          centerLat += coord[1]
          count++
        })
        centerLng /= count
        centerLat /= count
      }

      // Create marker element
      const el = document.createElement('div')
      el.className = 'parcel-marker'
      el.style.backgroundColor = parcel.ios_flag ? '#3b82f6' : '#94a3b8'
      el.style.width = '32px'
      el.style.height = '32px'
      el.style.borderRadius = '50%'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.color = 'white'
      el.style.fontWeight = '600'
      el.style.fontSize = '14px'
      el.style.cursor = 'pointer'
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
      el.style.transition = 'transform 0.2s'
      el.textContent = String(index + 1)

      // Highlight if selected
      if (selectedParcel && selectedParcel.id === parcel.id) {
        el.style.border = '3px solid #fbbf24'
        el.style.transform = 'scale(1.2)'
      }

      // Click handler with zoom
      el.addEventListener('click', async () => {
        // Fetch full parcel details
        try {
          const response = await fetch(`${API_URL}/parcels/${parcel.id}`)
          const fullParcel = await response.json()
          setSelectedParcel(fullParcel)
        } catch (error) {
          console.error('Error fetching parcel details:', error)
          setSelectedParcel(parcel)
        }

        // Zoom to parcel
        currentMap.flyTo({
          center: [centerLng, centerLat],
          zoom: 17,
          duration: 1500,
        })
      })

      // Add marker to map
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([centerLng, centerLat])
        .addTo(currentMap)

      markers.current.push(marker)
    })
  }, [filteredParcels, selectedParcel, features, setSelectedParcel])

  // Zoom to selected parcel
  useEffect(() => {
    if (!map.current || !selectedParcel) return

    const feature = features.find((f) => f.id === selectedParcel.id)
    if (!feature || !feature.geometry) return

    // Calculate centroid
    let centerLng = 0
    let centerLat = 0
    let count = 0

    const coords = feature.geometry.coordinates[0]
    if (coords && coords.length > 0) {
      coords.forEach((coord: number[]) => {
        centerLng += coord[0]
        centerLat += coord[1]
        count++
      })
      centerLng /= count
      centerLat /= count

      map.current.flyTo({
        center: [centerLng, centerLat],
        zoom: 17,
        duration: 1500,
      })
    }
  }, [selectedParcel, features])

  return <div ref={mapContainer} className="map-container" />
}

export default Map
