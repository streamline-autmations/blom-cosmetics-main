import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { stockists, Stockist } from '../../data/stockists';

const flowerIcon = (isMain: boolean) => {
  const size = isMain ? 40 : 34;
  const height = isMain ? 52 : 44;
  return L.divIcon({
    className: 'blom-pin',
    html: `
      <svg width="${size}" height="${height}" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(15,23,42,0.35));">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 12.75 17 27 17 27s17-14.25 17-27C34 7.6 26.4 0 17 0z" fill="#FF74A4" stroke="#ffffff" stroke-width="2"/>
        <g transform="translate(17,16.5)">
          <circle cx="0" cy="-5.2" r="3.7" fill="#ffffff"/>
          <circle cx="4.9" cy="-1.6" r="3.7" fill="#ffffff"/>
          <circle cx="3" cy="4.2" r="3.7" fill="#ffffff"/>
          <circle cx="-3" cy="4.2" r="3.7" fill="#ffffff"/>
          <circle cx="-4.9" cy="-1.6" r="3.7" fill="#ffffff"/>
          <circle cx="0" cy="0" r="2.5" fill="#FF74A4"/>
        </g>
      </svg>
    `,
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height + 6]
  });
};

const bounds = L.latLngBounds(stockists.map((s) => [s.lat, s.lng] as [number, number]));

interface MapControllerProps {
  selectedId?: string;
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
  suppressResetRef: React.MutableRefObject<boolean>;
}

const MapController: React.FC<MapControllerProps> = ({ selectedId, markerRefs, suppressResetRef }) => {
  const map = useMap();
  const prevIdRef = useRef(selectedId);

  useEffect(() => {
    if (selectedId === prevIdRef.current) return;
    prevIdRef.current = selectedId;

    if (!selectedId) return;
    const stockist = stockists.find((s) => s.id === selectedId);
    if (!stockist) return;

    suppressResetRef.current = true;
    map.flyTo([stockist.lat, stockist.lng], Math.max(map.getZoom(), 12), {
      duration: 0.9
    });

    const marker = markerRefs.current[selectedId];
    if (marker) {
      window.setTimeout(() => {
        marker.openPopup();
        window.setTimeout(() => {
          suppressResetRef.current = false;
        }, 300);
      }, 450);
    } else {
      suppressResetRef.current = false;
    }
  }, [selectedId, map, markerRefs, suppressResetRef]);

  useEffect(() => {
    const handlePopupClose = () => {
      if (suppressResetRef.current) return;
      map.flyToBounds(bounds, { padding: [48, 48], duration: 0.9 });
    };
    map.on('popupclose', handlePopupClose);
    return () => {
      map.off('popupclose', handlePopupClose);
    };
  }, [map, suppressResetRef]);

  return null;
};

interface StockistMapProps {
  className?: string;
  heightClassName?: string;
  selectedId?: string;
  onSelectId?: (id: string) => void;
}

export const StockistMap: React.FC<StockistMapProps> = ({
  className = '',
  heightClassName = 'h-[420px] md:h-[560px]',
  selectedId,
  onSelectId
}) => {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const suppressResetRef = useRef(false);

  return (
    <div
      className={`${heightClassName} ${className} rounded-2xl border border-gray-100 overflow-hidden shadow-[0_16px_40px_rgba(255,116,164,0.16)]`}
    >
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [48, 48] }}
        scrollWheelZoom
        touchZoom
        tap
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={90}
        style={{ width: '100%', height: '100%', background: '#eef2f6' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <MapController selectedId={selectedId} markerRefs={markerRefs} suppressResetRef={suppressResetRef} />
        {stockists.map((stockist: Stockist) => (
          <Marker
            key={stockist.id}
            position={[stockist.lat, stockist.lng]}
            icon={flowerIcon(stockist.kind === 'main')}
            ref={(el) => {
              markerRefs.current[stockist.id] = el;
            }}
            eventHandlers={{
              click: () => {
                suppressResetRef.current = true;
                onSelectId?.(stockist.id);
                window.setTimeout(() => {
                  suppressResetRef.current = false;
                }, 600);
              }
            }}
          >
            <Popup
              className="blom-popup"
              autoPanPaddingTopLeft={[16, 130]}
              autoPanPaddingBottomRight={[16, 16]}
            >
              <div className="text-sm min-w-[160px]">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-primary-pink mb-1">
                  {stockist.kind === 'main' ? 'Main Store' : 'Distributor'}
                </span>
                <p className="font-semibold text-gray-900 leading-snug">{stockist.name}</p>
                <p className="text-gray-600 mt-1">{stockist.fullAddress}</p>
                {stockist.phone && <p className="text-gray-600 mt-1">{stockist.phone}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
