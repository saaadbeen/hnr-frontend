import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Layout, Button, Typography, Spin, notification } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
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
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const markersRef = useRef([]);
  const polygonRef = useRef(null);
  const polylineRef = useRef(null);
  const [polygonPoints, setPolygonPoints] = useState([]);

  // Charger Leaflet
  const loadLeaflet = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.L && window.L.version) {
      setLeafletLoaded(true);
      return;
    }
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
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => { loadLeaflet(); }, [loadLeaflet]);

  // Initialiser la carte
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;
    if (!window.L) return;

    const map = window.L.map(mapRef.current, {
      center: CENTER,
      zoom: ZOOM,
      zoomControl: true,
    });

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const newPoints = [...polygonPoints, [lat, lng]];
      setPolygonPoints(newPoints);

      addMarker([lat, lng], newPoints.length);

      if (newPoints.length >= 2) updatePolyline(newPoints);
      if (newPoints.length >= 3) {
        updatePolygon(newPoints);
        const geometry = {
          type: 'Polygon',
          coordinates: [
            [...newPoints.map(([la, ln]) => [ln, la]), [newPoints[0][1], newPoints[0][0]]]
          ]
        };
        notification.success({ message: 'Polygone créé', description: `${newPoints.length} sommets` });
        navigate('/missions/nouveau', { state: { ...missionData, geometry } });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, polygonPoints, navigate, missionData]);

  // Fonctions dessin
  const addMarker = (latlng, label) => {
    const icon = window.L.divIcon({
      html: `<div style="width:24px;height:24px;background:#1890ff;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;">${label}</div>`,
      className: 'custom-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    const marker = window.L.marker(latlng, { icon }).addTo(mapInstanceRef.current);
    markersRef.current.push(marker);
  };

  const updatePolyline = (points) => {
    if (polylineRef.current) {
      mapInstanceRef.current.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    polylineRef.current = window.L.polyline(points, { color: '#1890ff', dashArray: '5,5' }).addTo(mapInstanceRef.current);
  };

  const updatePolygon = (points) => {
    if (polygonRef.current) {
      mapInstanceRef.current.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
    polygonRef.current = window.L.polygon(points, { color: '#52c41a', fillOpacity: 0.2 }).addTo(mapInstanceRef.current);
  };

  if (!leafletLoaded) {
    return (
      <Layout style={{ height: '100vh' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" tip="Chargement de la carte..." />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/missions/nouveau')}>Retour</Button>
        <Title level={4} style={{ margin: '8px 0 0' }}>Sélectionnez une zone</Title>
        <Text type="secondary">Cliquez sur la carte pour dessiner un polygone</Text>
      </div>
      <Content>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </Content>
    </Layout>
  );
}
