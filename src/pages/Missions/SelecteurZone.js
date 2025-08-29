import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Layout, Card, Button, Typography, Alert, notification, Space, Spin } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;

const CENTER = [33.6, -7.4];
const ZOOM = 11;

export default function SelecteurZone() {
  const navigate = useNavigate();
  const location = useLocation();
  const missionData = location.state?.missionData || {};

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneType, setZoneType] = useState('polygon');
  const [polygonPoints, setPolygonPoints] = useState([]);

  const markersRef = useRef([]);
  const polygonRef = useRef(null);
  const polylineRef = useRef(null);

  const loadLeaflet = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (window.L && window.L.version) {
      setLeafletLoaded(true);
      return;
    }
    try {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
      if (!document.querySelector('script[src*="leaflet.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.crossOrigin = '';
        script.onload = () => {
          setTimeout(() => {
            if (window.L && window.L.version) {
              try {
                delete window.L.Icon.Default.prototype._getIconUrl;
                window.L.Icon.Default.mergeOptions({
                  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                });
              } catch {}
              setLeafletLoaded(true);
            }
          }, 100);
        };
        script.onerror = () => console.error('Erreur lors du chargement de Leaflet');
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de Leaflet:', error);
    }
  }, []);

  useEffect(() => { loadLeaflet(); }, [loadLeaflet]);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;
    if (!window.L || !window.L.version) return;

    if (mapRef.current._leaflet_id) {
      try { mapRef.current._leaflet_id = null; } catch {}
    }

    try {
      const map = window.L.map(mapRef.current, { center: CENTER, zoom: ZOOM, zoomControl: false, attributionControl: true });
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18
      });
      tileLayer.addTo(map);
      window.L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (zoneType === 'point') handlePointClick([lat, lng]);
        else if (zoneType === 'polygon') handlePolygonClick([lat, lng]);
      });

      mapInstanceRef.current = map;
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          setMapLoaded(true);
        }
      }, 200);
    } catch (err) {
      console.error('Erreur initialisation carte:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try { clearAllLayers(); mapInstanceRef.current.remove(); } catch {} finally { mapInstanceRef.current = null; }
      }
    };
  }, [leafletLoaded, zoneType]);

  const handlePointClick = (latlng) => {
    clearAllLayers();
    addMarker(latlng, '📍');
    setSelectedZone({ type: 'Point', coordinates: [latlng[1], latlng[0]] });
    notification.info({ message: 'Point sélectionné', description: `Position: ${latlng[0].toFixed(5)}, ${latlng[1].toFixed(5)}`, duration: 2 });
  };

  const handlePolygonClick = (latlng) => {
    const newPoints = [...polygonPoints, latlng];
    setPolygonPoints(newPoints);
    addMarker(latlng, newPoints.length.toString());
    if (newPoints.length >= 2) updatePolyline(newPoints);
    if (newPoints.length >= 3) {
      updatePolygon(newPoints);
      setSelectedZone({ type: 'Polygon', coordinates: [newPoints.map(p => [p[1], p[0]])] });
      notification.success({ message: 'Polygone créé', description: `Polygone avec ${newPoints.length} points`, duration: 2 });
    } else {
      notification.info({ message: `Point ${newPoints.length} ajouté`, description: `${3 - newPoints.length} point(s) minimum requis`, duration: 1 });
    }
  };

  const addMarker = (position, label) => {
    if (!mapInstanceRef.current || !window.L) return;
    try {
      const icon = window.L.divIcon({
        html: `<div style="width:28px;height:28px;background:#1890ff;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${label}</div>`,
        className: 'custom-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const marker = window.L.marker(position, { icon });
      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    } catch (error) {
      console.error('Erreur lors de la création du marqueur:', error);
    }
  };

  const updatePolyline = (points) => {
    if (!mapInstanceRef.current || !window.L || points.length < 2) return;
    try {
      if (polylineRef.current) { mapInstanceRef.current.removeLayer(polylineRef.current); polylineRef.current = null; }
      const polyline = window.L.polyline(points, { color: '#1890ff', weight: 3, opacity: 0.8, dashArray: '5, 10' });
      polyline.addTo(mapInstanceRef.current);
      polylineRef.current = polyline;
    } catch (error) {
      console.error('Erreur lors de la création de la polyline:', error);
    }
  };

  const updatePolygon = (points) => {
    if (!mapInstanceRef.current || !window.L || points.length < 3) return;
    try {
      if (polylineRef.current) { mapInstanceRef.current.removeLayer(polylineRef.current); polylineRef.current = null; }
      if (polygonRef.current) { mapInstanceRef.current.removeLayer(polygonRef.current); polygonRef.current = null; }
      const polygon = window.L.polygon(points, { color: '#1890ff', fillColor: '#1890ff', fillOpacity: 0.2, weight: 3, opacity: 0.8 });
      polygon.addTo(mapInstanceRef.current);
      polygonRef.current = polygon;
      try {
        const bounds = polygon.getBounds();
        if (bounds.isValid()) mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
      } catch {}
    } catch (error) {
      console.error('Erreur lors de la création du polygone:', error);
    }
  };

  const clearAllLayers = () => {
    if (!mapInstanceRef.current) return;
    try {
      markersRef.current.forEach(marker => { try { mapInstanceRef.current.removeLayer(marker); } catch {} });
      markersRef.current = [];
      if (polygonRef.current) { try { mapInstanceRef.current.removeLayer(polygonRef.current); } catch {} polygonRef.current = null; }
      if (polylineRef.current) { try { mapInstanceRef.current.removeLayer(polylineRef.current); } catch {} polylineRef.current = null; }
    } catch (error) {
      console.warn('Erreur lors du nettoyage des layers:', error);
    }
  };

  const resetSelection = () => { clearAllLayers(); setSelectedZone(null); setPolygonPoints([]); };

  const confirmSelection = () => {
    if (!selectedZone) {
      notification.error({ message: 'Aucune zone sélectionnée', description: 'Veuillez sélectionner une zone sur la carte' });
      return;
    }
    if (selectedZone.type !== 'Polygon') {
      notification.error({ message: 'Zone invalide', description: 'La mission doit être définie par un polygone (au moins 3 points).' });
      return;
    }
    navigate('/missions/nouveau', { state: { ...missionData, geometry: selectedZone, fromZoneSelector: true } });
  };

  const switchMode = (mode) => {
    if (mode !== zoneType) { setZoneType(mode); resetSelection(); }
  };

  const formatZoneInfo = () => {
    if (!selectedZone) return null;
    if (selectedZone.type === 'Point') {
      const [lng, lat] = selectedZone.coordinates;
      return `Point: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } else if (selectedZone.type === 'Polygon') {
      const pointCount = selectedZone.coordinates[0].length;
      return `Polygone: ${pointCount} points`;
    }
    return 'Zone définie';
  };

  if (!leafletLoaded) {
    return (
      <Layout style={{ height: '100vh' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" tip="Chargement de Leaflet..." />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <div style={{
        background: '#fff', padding: '16px 24px', borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/missions/nouveau', { state: missionData })}>
            Retour
          </Button>
          <div>
            <Title level={4} style={{ margin: 0 }}>Sélection de la zone d'intervention</Title>
            <Text type="secondary">
              {zoneType === 'point'
                ? 'Cliquez pour placer un point'
                : `Cliquez pour dessiner un polygone (${polygonPoints.length} point${polygonPoints.length > 1 ? 's' : ''} ajouté${polygonPoints.length > 1 ? 's' : ''})`}
            </Text>
          </div>
        </div>

        <Space>
          <Button type={zoneType === 'point' ? 'primary' : 'default'} onClick={() => switchMode('point')}>Point</Button>
          <Button type={zoneType === 'polygon' ? 'primary' : 'default'} onClick={() => switchMode('polygon')}>Polygone</Button>
          <Button icon={<DeleteOutlined />} onClick={resetSelection} disabled={!selectedZone && polygonPoints.length === 0}>Effacer</Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={confirmSelection} disabled={!selectedZone}>Confirmer la sélection</Button>
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message={
            zoneType === 'point'
              ? 'Cliquez sur la carte pour placer un point de mission'
              : polygonPoints.length === 0
                ? 'Cliquez sur la carte pour commencer à dessiner un polygone'
                : polygonPoints.length < 3
                  ? `Continuez à cliquer pour ajouter des points (${3 - polygonPoints.length} minimum requis)`
                  : 'Polygone créé ! Vous pouvez continuer à ajouter des points ou confirmer'
          }
        />
        {selectedZone && (
          <Alert type="success" showIcon style={{ marginTop: 8 }} message={`Zone sélectionnée: ${selectedZone.type}`} description={formatZoneInfo()} />
        )}
      </div>

      <Content style={{ position: 'relative', flex: 1 }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%', cursor: zoneType === 'polygon' && !selectedZone ? 'crosshair' : 'default', background: '#f0f0f0' }} />
        {!mapLoaded && leafletLoaded && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
            <Spin size="large" tip="Initialisation de la carte..." />
          </div>
        )}
      </Content>
    </Layout>
  );
}
