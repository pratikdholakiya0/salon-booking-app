import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import api from '../api';
import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

export default function Map() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const distInputRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false); 

  const [dista, setDista] = useState(3);
  const [userCoords, setUserCoords] = useState(null);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setDista(Number(distInputRef.current.value));
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserCoords({ lat, lng });

        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [lng, lat],
          zoom: 13,
        });

        map.on("load", () => {
          new mapboxgl.Marker({ color: "blue" })
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup().setHTML("<h3>You are here</h3>"))
            .addTo(map);

          map.addSource("circle", {
            type: "geojson",
            data: turf.circle([lng, lat], 0.001, { units: "kilometers", steps: 64 }),
          });

          map.addLayer({
            id: "circle-fill",
            type: "fill",
            source: "circle",
            paint: { "fill-color": "#2196f3", "fill-opacity": 0.2 },
          });

          map.addLayer({
            id: "circle-outline",
            type: "line",
            source: "circle",
            paint: { "line-color": "#2196f3", "line-width": 2 },
          });

          mapRef.current = map;
          setMapLoaded(true);
        });
      },
      (error) => {
        console.error(error);
        alert("Unable to get your location.");
      }
    );

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userCoords || !mapLoaded) return;

    const { lat, lng } = userCoords;
    const customer = turf.point([lng, lat]);
    const circle = turf.circle(customer, dista, { units: "kilometers", steps: 64 });

    const source = map.getSource("circle");
    if (source) source.setData(circle);

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    (async () => {
      const salons = await api.post("/map", { lati: lat, long: lng, dist: dista });

      const nearby = salons.data.nearbySalons
        .map((salon) => {
          const salonPoint = turf.point([salon.longitude, salon.latitude]);
          const distance = turf.distance(customer, salonPoint, { units: "kilometers" });
          const inside = turf.booleanPointInPolygon(salonPoint, circle);

          const marker = new mapboxgl.Marker({ color: inside ? "green" : "red" })
            .setLngLat([salon.longitude, salon.latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML(`
                <a href="/salons/${salon.userId}">
                  <h3>${salon.salonName}</h3>
                  <p>${distance.toFixed(2)} km</p>
                </a>
              `)
            )
            .addTo(map);

          markersRef.current.push(marker);

          return { ...salon, distance: Number(distance.toFixed(2)), inside };
        })
        .filter((salon) => salon.inside)
        .sort((a, b) => a.distance - b.distance);

      console.log("Nearby Salons");
      console.table(nearby);
    })();
  }, [dista, userCoords, mapLoaded]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <form
        className="distance-form"
        onSubmit={handleSubmit}
        style={{ position: "absolute", zIndex: 2, left: "2rem", top: "2rem" }}
      >
        <div className="distance-input-wrapper">
          <label className="distance-label" htmlFor="distance">Distance (km)</label>
          <input
            id="distance"
            ref={distInputRef}
            className="distance-input"
            type="number"
            placeholder="e.g. 5"
            min={3}
            max={20}
            defaultValue={3}
          />
        </div>
        <button className="distance-submit" type="submit">Enter</button>
      </form>

      <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />
    </div>
  );
}