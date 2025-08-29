import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Select,
  DatePicker,
  Drawer,
  Typography,
  Spin,
  Badge,
  Empty,
  Tooltip
} from 'antd';
import {
  FilterOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  ClusterOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMock } from '../../services/mockApi';
import { debounce, parseQueryString } from '../../utils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CENTER = [33.6, -7.4];
const ZOOM = 11;
const MAX_MARKERS = 100;
const MOBILE_BREAKPOINT = 768;

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= MOBILE_BREAKPOINT;
};

export default function Carte() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAgent = user?.role === 'AGENT_AUTORITE';
  const { missions, changements } = useMock();
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const markerClusterRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [filters, setFilters] = useState({
    view: 'all',
    type: null,
    dateRange: null,
    status: null,
    commune: isAgent ? user.commune : null
  });

  
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        try {
          const leafletCSS = document.createElement('link');
          leafletCSS.rel = 'stylesheet';
          leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          leafletCSS.crossOrigin = '';
          document.head.appendChild(leafletCSS);

          const clusterCSS = document.createElement('link');
          clusterCSS.rel = 'stylesheet';
          clusterCSS.href = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css';
          document.head.appendChild(clusterCSS);

          const clusterDefaultCSS = document.createElement('link');
          clusterDefaultCSS.rel = 'stylesheet';
          clusterDefaultCSS.href = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css';
          document.head.appendChild(clusterDefaultCSS);

          await new Promise((resolve, reject) => {
            const leafletJS = document.createElement('script');
            leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            leafletJS.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            leafletJS.crossOrigin = '';
            leafletJS.onload = resolve;
            leafletJS.onerror = reject;
            document.head.appendChild(leafletJS);
          });

          await new Promise((resolve, reject) => {
            const clusterJS = document.createElement('script');
            clusterJS.src = 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js';
            clusterJS.onload = resolve;
            clusterJS.onerror = reject;
            document.head.appendChild(clusterJS);
          });

          delete window.L.Icon.Default.prototype._getIconUrl;
          window.L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });

          setMapLoaded(true);
        } catch (error) {
          console.error('Erreur chargement Leaflet:', error);
        }
      } else if (window.L) {
        setMapLoaded(true);
      }
    };
    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    if (mapInstanceRef.current) return;
    
    if (mapRef.current._leaflet_id) {
      try { 
        mapRef.current._leaflet_id = null; 
        mapRef.current.innerHTML = '';
      } catch (e) {
        console.warn('Cleanup carte:', e);
      }
    }

    try {
      const isMobileTouch = isMobileDevice();
      
      const map = window.L.map(mapRef.current, {
        center: CENTER,
        zoom: ZOOM,
        zoomControl: false,
        dragging: !isMobileTouch,
        touchZoom: true,
        doubleClickZoom: !isMobileTouch,
        scrollWheelZoom: !isMobileTouch,
        boxZoom: !isMobileTouch,
        keyboard: true,
        tap: !isMobileTouch,
        tapTolerance: 15,
        gestureHandling: isMobileTouch
      });

      if (isMobileTouch) {
        const gestureDiv = document.createElement('div');
        gestureDiv.innerHTML = `
          <div style="
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8); 
            color: white; 
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
          ">
            Utilisez 2 doigts pour déplacer la carte
          </div>
        `;
        mapRef.current.appendChild(gestureDiv);

        let touchCount = 0;
        map.on('touchstart', (e) => {
          touchCount = e.originalEvent.touches.length;
          if (touchCount === 1) {
            gestureDiv.firstChild.style.opacity = '1';
            setTimeout(() => {
              gestureDiv.firstChild.style.opacity = '0';
            }, 1500);
          }
        });

        map.on('touchend', () => {
          touchCount = 0;
          gestureDiv.firstChild.style.opacity = '0';
        });
      }

      const tiles = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      tiles.on('load', () => {
        setTimeout(() => map.invalidateSize(), 100);
      });

      window.L.control.zoom({ 
        position: isMobile ? 'bottomright' : 'topleft' 
      }).addTo(map);

      const mapContainer = mapRef.current;
      mapContainer.setAttribute('role', 'application');
      mapContainer.setAttribute('aria-label', 'Carte interactive des missions et changements');
      mapContainer.setAttribute('tabindex', '0');

      mapContainer.addEventListener('keydown', (e) => {
        const step = 0.01;
        const center = map.getCenter();
        let newCenter = null;

        switch(e.key) {
          case 'ArrowUp':
            newCenter = [center.lat + step, center.lng];
            break;
          case 'ArrowDown':
            newCenter = [center.lat - step, center.lng];
            break;
          case 'ArrowLeft':
            newCenter = [center.lat, center.lng - step];
            break;
          case 'ArrowRight':
            newCenter = [center.lat, center.lng + step];
            break;
          case '+':
          case '=':
            map.zoomIn();
            break;
          case '-':
            map.zoomOut();
            break;
          default:
            return;
        }

        if (newCenter) {
          map.setView(newCenter, map.getZoom());
        }
        e.preventDefault();
      });

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
      
    } catch (err) {
      console.error('Erreur initialisation carte:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          if (markerClusterRef.current) {
            markerClusterRef.current = null;
          }
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }
    };
  }, [mapLoaded, isMobile]);

  useEffect(() => {
    const handleResize = debounce(() => {
      const wasMobile = isMobile;
      const nowMobile = isMobileDevice();
      
      setIsMobile(nowMobile);
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        
        if (wasMobile !== nowMobile) {
          const currentCenter = mapInstanceRef.current.getCenter();
          const currentZoom = mapInstanceRef.current.getZoom();
          
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView(currentCenter, currentZoom);
            }
          }, 100);
        }
      }
    }, 300);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  useEffect(() => {
    const queryParams = parseQueryString(location.search);
    if (Object.keys(queryParams).length > 0) {
      setFilters(prev => ({ ...prev, ...queryParams }));
    }
  }, [location.search]);

  const toNumber = useCallback((v) => {
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isFinite(n) ? n : undefined;
  }, []);
  
  const getSafePosition = useCallback((item) => {
    const g = item?.geometry;
    if (g && g.type === 'Point' && Array.isArray(g.coordinates)) {
      const lng = toNumber(g.coordinates[0]);
      const lat = toNumber(g.coordinates[1]);
      if (lat !== undefined && lng !== undefined) return [lat, lng];
    }
    const latAlt = toNumber(item?.latitude ?? item?.lat);
    const lngAlt = toNumber(item?.longitude ?? item?.lng);
    if (latAlt !== undefined && lngAlt !== undefined) return [latAlt, lngAlt];
    return [CENTER[0], CENTER[1]];
  }, [toNumber]);

  const filteredData = useMemo(() => {
    let data = [];

    const userFilteredMissions = missions.filter(m => {
      if (isAgent) {
        return m.commune === user.commune && m.prefecture === user.prefecture;
      }
      return true;
    });

    const userFilteredChangements = changements.filter(c => {
      if (isAgent) {
        return c.commune === user.commune && c.prefecture === user.prefecture;
      }
      return true;
    });

    if (filters.view === 'all' || filters.view === 'missions') {
      const ms = userFilteredMissions.filter(m => {
        if (filters.status && m.status !== filters.status) return false;
        if (filters.commune && m.commune !== filters.commune) return false;
        if (filters.dateRange) {
          const [start, end] = filters.dateRange;
          const d = new Date(m.createdAt || m.date);
          if (d < start || d > end) return false;
        }
        return true;
      });
      data = [...data, ...ms.map(m => ({ ...m, dataType: 'mission' }))];
    }

    if (filters.view === 'all' || filters.view === 'changements') {
      const cs = userFilteredChangements.filter(c => {
        if (filters.type && c.type !== filters.type) return false;
        if (filters.commune && c.commune !== filters.commune) return false;
        if (filters.dateRange) {
          const [start, end] = filters.dateRange;
          const d = new Date(c.dateDetection);
          if (d < start || d > end) return false;
        }
        return true;
      });
      data = [...data, ...cs.map(c => ({ ...c, dataType: 'changement' }))];
    }

    if (data.length > MAX_MARKERS) data = data.slice(0, MAX_MARKERS);
    return data;
  }, [missions, changements, filters, user, isAgent]);

  const getMarkerColor = useCallback((item) => {
    if (item.dataType === 'mission') {
      switch (item.status) {
        case 'PLANIFIEE': return '#1890ff';
        case 'EN_COURS': return '#faad14';
        case 'TERMINEE': return '#52c41a';
        default: return '#d9d9d9';
      }
    }
    if (item.dataType === 'changement') {
      switch (item.statut) {
        case 'DETECTE': return '#ff4d4f';
        case 'EN_TRAITEMENT': return '#fa8c16';
        case 'TRAITE': return '#52c41a';
        default: return '#d9d9d9';
      }
    }
    return '#d9d9d9';
  }, []);

  const createPopupContent = useCallback((item) => {
    const type = item.dataType === 'mission' ? 'Mission' : 'Changement';
    const title = item.titre || `Changement ${item.type}`;
    const status = item.status || item.statut;
    const description = item.description || item.observations || '';

    return `
      <div style="min-width: 200px;" role="dialog" aria-labelledby="popup-title-${item.id}">
        <h4 id="popup-title-${item.id}" style="margin: 0 0 8px 0; font-size: 14px;">${title}</h4>
        <div style="margin-bottom: 4px;">
          <span style="background: ${getMarkerColor(item)}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
            ${type}
          </span>
        </div>
        ${item.commune ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">${item.commune}, ${item.prefecture}</div>` : ''}
        ${status ? `<div style="font-size: 12px; margin-bottom: 4px;"><strong>Statut:</strong> ${status}</div>` : ''}
        ${item.surface ? `<div style="font-size: 12px; margin-bottom: 4px;"><strong>Surface:</strong> ${item.surface} m²</div>` : ''}
        ${description ? `<div style="font-size: 11px; color: #666; margin-top: 8px;">${description.slice(0, 100)}${description.length > 100 ? '...' : ''}</div>` : ''}
      </div>
    `;
  }, [getMarkerColor]);

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.L) return;

    if (markerClusterRef.current) {
      mapInstanceRef.current.removeLayer(markerClusterRef.current);
    }
    markersRef.current.forEach(m => {
      if (mapInstanceRef.current.hasLayer(m)) {
        mapInstanceRef.current.removeLayer(m);
      }
    });
    markersRef.current = [];

    if (filteredData.length === 0) return;

    const markers = filteredData.map(item => {
      const position = getSafePosition(item);
      const color = getMarkerColor(item);
      
      const icon = window.L.divIcon({
        html: `
          <div style="
            width:20px;
            height:20px;
            background:${color};
            border:2px solid #fff;
            border-radius:50%;
            box-shadow:0 2px 4px rgba(0,0,0,0.3);
          " 
          role="button" 
          aria-label="${item.dataType === 'mission' ? 'Mission' : 'Changement'} - ${item.titre || item.type}"
          tabindex="0">
          </div>
        `,
        className: 'custom-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      const marker = window.L.marker(position, { 
        icon,
        keyboard: true,
        title: `${item.dataType === 'mission' ? 'Mission' : 'Changement'}: ${item.titre || item.type}`
      });
      
      marker.bindPopup(createPopupContent(item), { 
        maxWidth: 300,
        closeButton: true,
        autoClose: true,
        closeOnEscapeKey: true
      });

      return marker;
    });

    if (clusteringEnabled && window.L.markerClusterGroup && markers.length > 10) {
      markerClusterRef.current = window.L.markerClusterGroup({
        maxClusterRadius: isMobile ? 60 : 80,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count >= 100) size = 'large';
          else if (count >= 10) size = 'medium';
          
          return window.L.divIcon({
            html: `<div class="cluster-${size}" style="
              background: rgba(24, 144, 255, 0.8);
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            " role="button" aria-label="${count} éléments groupés">${count}</div>`,
            className: 'marker-cluster',
            iconSize: size === 'large' ? [50, 50] : size === 'medium' ? [40, 40] : [30, 30]
          });
        }
      });
      
      markerClusterRef.current.addLayers(markers);
      mapInstanceRef.current.addLayer(markerClusterRef.current);
    } else {
      markers.forEach(marker => {
        marker.addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
      });
    }
  }, [filteredData, getSafePosition, getMarkerColor, createPopupContent, clusteringEnabled, isMobile]);

  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      updateMarkers();
    }
  }, [updateMarkers, mapLoaded]);

  const simulateNetworkDelay = useCallback(async () => {
    setLoading(true);   // ✅
    await new Promise(r => setTimeout(r, 500));
    setLoading(false);
  }, []);


  const debouncedFilterChange = useMemo(
    () => debounce((newFilters) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
      simulateNetworkDelay();
    }, 500),
    [simulateNetworkDelay]
  );

  const handleFilterChange = useCallback((key, value) => {
    debouncedFilterChange({ [key]: value });
  }, [debouncedFilterChange]);

  const clearFilters = useCallback(() => {
    setFilters({
      view: 'all',
      type: null,
      dateRange: null,
      status: null,
      commune: isAgent ? user.commune : null
    });
    navigate('/carte', { replace: true });
  }, [navigate, isAgent, user.commune]);

  const navigateToMissionCreation = useCallback(() => {
    navigate('/missions/selecteur-zone');
  }, [navigate]);

  const toggleClustering = useCallback(() => {
    setClusteringEnabled(prev => !prev);
  }, []);

  const FiltersPanel = useMemo(() => () => (
    <div style={{ padding: 16 }} role="region" aria-label="Panneau de filtres">
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <div>
          <Text strong>Vue</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={filters.view}
            onChange={(value) => handleFilterChange('view', value)}
            aria-label="Sélectionner le type de vue"
          >
            <Select.Option value="all">Tout afficher</Select.Option>
            <Select.Option value="missions">Missions uniquement</Select.Option>
            <Select.Option value="changements">Changements uniquement</Select.Option>
          </Select>
        </div>

        <div>
          <Text strong>Type de changement</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
            placeholder="Tous les types"
            allowClear
            aria-label="Filtrer par type de changement"
          >
            <Select.Option value="EXTENSION_HORIZONTALE">Extension horizontale</Select.Option>
            <Select.Option value="EXTENSION_VERTICALE">Extension verticale</Select.Option>
            <Select.Option value="CONSTRUCTION_NOUVELLE">Construction nouvelle</Select.Option>
          </Select>
        </div>

        <div>
          <Text strong>Statut mission</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            placeholder="Tous les statuts"
            allowClear
            aria-label="Filtrer par statut de mission"
          >
            <Select.Option value="PLANIFIEE">Planifiée</Select.Option>
            <Select.Option value="EN_COURS">En cours</Select.Option>
            <Select.Option value="TERMINEE">Terminée</Select.Option>
          </Select>
        </div>

        {user?.role !== 'AGENT_AUTORITE' && (
          <div>
            <Text strong>Commune</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={filters.commune}
              onChange={(value) => handleFilterChange('commune', value)}
              placeholder="Toutes les communes"
              allowClear
              aria-label="Filtrer par commune"
            >
              <Select.Option value="Anfa">Anfa</Select.Option>
              <Select.Option value="Maarif">Maarif</Select.Option>
              <Select.Option value="Sidi Bernoussi">Sidi Bernoussi</Select.Option>
              <Select.Option value="Aïn Sebaâ">Aïn Sebaâ</Select.Option>
              <Select.Option value="Hay Mohammadi">Hay Mohammadi</Select.Option>
              <Select.Option value="Al Fida">Al Fida</Select.Option>
              <Select.Option value="Mers Sultan">Mers Sultan</Select.Option>
              <Select.Option value="Moulay Rachid">Moulay Rachid</Select.Option>
              <Select.Option value="Ain Chock">Ain Chock</Select.Option>
              <Select.Option value="Hay Hassani">Hay Hassani</Select.Option>
              <Select.Option value="Mohammedia">Mohammedia</Select.Option>
              <Select.Option value="Ben Yakhlef">Ben Yakhlef</Select.Option>
            </Select>
          </div>
        )}

        <div>
          <Text strong>Période</Text>
          <RangePicker
            style={{ width: '100%', marginTop: 8 }}
            value={filters.dateRange}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
            format="DD/MM/YYYY"
            aria-label="Sélectionner une période"
          />
        </div>

        <div>
          <Space style={{ width: '100%' }} direction="vertical">
            
            
            <Button onClick={clearFilters} block>
              Effacer les filtres
            </Button>
          </Space>
        </div>
      </Space>
    </div>
  ), [filters, handleFilterChange, user?.role, clearFilters, clusteringEnabled, toggleClustering]);

  if (isMobile) {
    return (
      <div style={{ height: '100vh', position: 'relative' }}>
        <div 
          ref={mapRef} 
          style={{ height: '100%', width: '100%', background: '#f0f0f0' }}
          role="application"
          aria-label="Carte interactive mobile"
          tabIndex={0}
        >
          {!mapLoaded && (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: '#f0f0f0' 
            }}>
              <Spin size="large" tip="Chargement de la carte..." />
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          <Space direction="vertical">
            <Tooltip title="Ouvrir les filtres">
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={() => setFiltersOpen(true)}
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label="Ouvrir le panneau de filtres"
              >
                <Badge 
                  count={Object.values(filters).filter(v => v && v !== 'all').length} 
                  offset={[10, 0]}
                >
                  Filtres
                </Badge>
              </Button>
            </Tooltip>

            <Tooltip title="Actualiser les données">
              <Button 
                icon={<ReloadOutlined />} 
                loading={loading} 
                onClick={simulateNetworkDelay}
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label="Actualiser les données de la carte"
              />
            </Tooltip>

            {!isAgent && (
              <Tooltip title="Créer une nouvelle mission">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={navigateToMissionCreation}
                  style={{ minWidth: 44, minHeight: 44 }}
                  aria-label="Créer une nouvelle mission"
                >
                  Mission
                </Button>
              </Tooltip>
            )}
          </Space>
        </div>

        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 1000 }}>
          <Card size="small">
            <Space>
              <EnvironmentOutlined />
              <Text strong>{filteredData.length}</Text>
              <Text type="secondary">éléments</Text>
              {loading && <Spin size="small" />}
            </Space>
          </Card>
        </div>

        <Drawer 
          title="Filtres et options" 
          placement="bottom" 
          height="70vh" 
          onClose={() => setFiltersOpen(false)} 
          open={filtersOpen}
          role="dialog"
          aria-label="Panneau de filtres mobile"
        >
          <FiltersPanel />
        </Drawer>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
      <div style={{ width: 320, background: '#fff', borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0 }}>Carte interactive</Title>
          <Text type="secondary">
            {isAgent ? `Données de ${user.commune}` : 'Filtrez et explorez les données géographiques'}
          </Text>
        </div>
        <FiltersPanel />
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <div 
          ref={mapRef} 
          style={{ height: '100%', width: '100%', background: '#f0f0f0' }}
          role="application"
          aria-label="Carte interactive principale"
          tabIndex={0}
        >
          {!mapLoaded && (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: '#f0f0f0' 
            }}>
              <Spin size="large" tip="Chargement de la carte..." />
            </div>
          )}
        </div>

        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              loading={loading} 
              onClick={simulateNetworkDelay}
              aria-label="Actualiser les données"
            >
              Actualiser
            </Button>

            {!isAgent && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={navigateToMissionCreation}
                aria-label="Créer une nouvelle mission"
              >
                Nouvelle mission
              </Button>
            )}

            <Button 
              icon={<FullscreenOutlined />} 
              onClick={() => console.log('Toggle fullscreen')}
              aria-label="Basculer en plein écran"
            />
          </Space>
        </div>

        <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1000 }}>
          <Card size="small" style={{ minWidth: 200 }}>
            <Space direction="vertical" size={8}>
              <div>
                <Badge color="#1890ff" text="Missions planifiées" /> 
                <Text style={{ marginLeft: 8 }}>
                  {filteredData.filter(d => d.dataType === 'mission' && d.status === 'PLANIFIEE').length}
                </Text>
              </div>
              <div>
                <Badge color="#faad14" text="Missions en cours" /> 
                <Text style={{ marginLeft: 8 }}>
                  {filteredData.filter(d => d.dataType === 'mission' && d.status === 'EN_COURS').length}
                </Text>
              </div>
              <div>
                <Badge color="#52c41a" text="Missions terminées" /> 
                <Text style={{ marginLeft: 8 }}>
                  {filteredData.filter(d => d.dataType === 'mission' && d.status === 'TERMINEE').length}
                </Text>
              </div>
              <div>
                <Badge color="#ff4d4f" text="Changements détectés" /> 
                <Text style={{ marginLeft: 8 }}>
                  {filteredData.filter(d => d.dataType === 'changement' && d.statut === 'DETECTE').length}
                </Text>
              </div>
              {loading && (
                <div style={{ textAlign: 'center' }}>
                  <Spin size="small" />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    Actualisation...
                  </Text>
                </div>
              )}
            </Space>
          </Card>
        </div>

        {filteredData.length === 0 && !loading && mapLoaded && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            zIndex: 1000 
          }}>
            <Card>
              <Empty 
                description="Aucune donnée à afficher avec ces filtres" 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}