import { dijkstra, resolveOperationalPoint, routeGeometry } from './src/routing.js';

const map = L.map('map', { zoomControl: true }).setView([49.6, 9.6], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const orm = L.tileLayer('https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: 'Railway overlay &copy; OpenRailwayMap contributors'
}).addTo(map);

let graph = null;
let activeRoute = null;
let activeStops = [];
let routeLayer = L.layerGroup().addTo(map);
let trainMarker = null;

async function loadGraph() {
  const response = await fetch('./data/reference-heilbronn-wuerzburg.graph.json');
  if (!response.ok) throw new Error(`Graph konnte nicht geladen werden: ${response.status}`);
  graph = await response.json();
  document.getElementById('status').textContent = 'Rail-Graph geladen';
}

function nodeById(id) {
  return graph.nodes.find(node => node.id === id);
}

function orderedOperationalPoints(routeResult) {
  const position = new Map(routeResult.nodeIds.map((id, index) => [id, index]));
  return graph.operational_points
    .filter(op => position.has(op.node_id))
    .sort((a, b) => position.get(a.node_id) - position.get(b.node_id));
}

function drawComputedRoute(routeResult) {
  routeLayer.clearLayers();
  trainMarker = null;
  const coords = routeGeometry(routeResult);

  L.polyline(coords, { weight: 6, opacity: .9 })
    .bindPopup(`${(routeResult.distanceM / 1000).toFixed(1)} km · berechnet aus Graph-Edges`)
    .addTo(routeLayer);

  activeStops = orderedOperationalPoints(routeResult);
  for (const op of activeStops) {
    const node = nodeById(op.node_id);
    if (!node) continue;
    L.circleMarker([node.lat, node.lon], { radius: 6, weight: 2, fillOpacity: 1 })
      .bindPopup(`<b>${op.name}</b><br>${op.id}`)
      .addTo(routeLayer);
  }

  if (coords.length) map.fitBounds(coords, { padding:[30,30] });
  document.querySelector('[data-tab="route"]').click();
  updateTimeline(0);
}

function renderTab(tab) {
  const el = document.getElementById('tabContent');

  if (tab === 'atlas') {
    const sourceStatus = graph?.source_metadata?.status ?? 'nicht geladen';
    el.innerHTML = `
      <h3>Atlas</h3>
      <div class="card">RailAtlas trennt Topologie, Infrastruktur, Betriebsstellen und Fahrplandaten.</div>
      <div class="kv">
        <span>Routing</span><span>Graph-basiert</span>
        <span>Graph</span><span>${sourceStatus}</span>
        <span>Testregion</span><span>Heilbronn → Würzburg</span>
        <span>Fahrplan</span><span>noch nicht angebunden</span>
      </div>`;
    return;
  }

  if (tab === 'route') {
    if (!activeRoute) {
      el.innerHTML = '<h3>Route</h3><div class="card">Noch keine Route berechnet.</div>';
      return;
    }

    el.innerHTML = `
      <h3>Route</h3>
      <div class="card"><b>${(activeRoute.distanceM / 1000).toFixed(1)} km</b><br>
      ${activeRoute.edgeIds.length} gerichtete Graph-Edges · Dijkstra</div>
      ${activeStops.map(op => `<div class="card"><b>${op.name}</b><br><span>${op.id}</span></div>`).join('')}
      <div class="card"><b>Datenstatus</b><br>Route wird berechnet; der aktuelle Graph ist noch ein Referenz-Fixture. Nächster Schritt: reproduzierbarer OSM-Import.</div>`;
    return;
  }

  el.innerHTML = `
    <h3>Zeitplan</h3>
    <div class="card">Fahrplandaten sind bewusst noch getrennt vom Infrastruktur-Routing. DELFI/GTFS/NeTEx folgt nach dem echten OSM-Graph.</div>
    ${activeStops.map(op => `<div class="kv"><span>${op.name}</span><span>—</span></div>`).join('')}`;
}

document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTab(btn.dataset.tab);
}));

function interpolate(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function updateTimeline(value) {
  if (!activeRoute) return;
  const coords = routeGeometry(activeRoute);
  if (coords.length < 2) return;

  const x = Number(value) / 100;
  const scaled = x * (coords.length - 1);
  const seg = Math.min(coords.length - 2, Math.floor(scaled));
  const local = scaled - seg;
  const pos = interpolate(coords[seg], coords[seg + 1], local);

  if (!trainMarker) {
    trainMarker = L.circleMarker(pos, { radius:9, weight:3, fillOpacity:1 }).addTo(routeLayer);
  } else {
    trainMarker.setLatLng(pos);
  }

  const distance = activeRoute.distanceM * x;
  document.getElementById('timelineLabel').textContent = `${(distance / 1000).toFixed(1)} km / ${(activeRoute.distanceM / 1000).toFixed(1)} km`;
}

document.getElementById('timeline').addEventListener('input', e => updateTimeline(e.target.value));

document.getElementById('routeBtn').addEventListener('click', () => {
  if (!graph) return;

  const fromText = document.getElementById('fromInput').value.trim();
  const toText = document.getElementById('toInput').value.trim();
  const from = resolveOperationalPoint(graph, fromText);
  const to = resolveOperationalPoint(graph, toText);

  if (!from || !to) {
    document.getElementById('status').textContent = 'Betriebsstelle im aktuellen Graph nicht gefunden';
    return;
  }

  const result = dijkstra(graph, from.node_id, to.node_id);
  if (!result) {
    document.getElementById('status').textContent = 'Keine Schienenverbindung im aktuellen Graph gefunden';
    return;
  }

  activeRoute = result;
  document.getElementById('status').textContent = `Route berechnet · ${(result.distanceM / 1000).toFixed(1)} km`;
  drawComputedRoute(result);
});

document.getElementById('ormToggle').addEventListener('change', e =>
  e.target.checked ? orm.addTo(map) : map.removeLayer(orm)
);

document.getElementById('historicToggle').addEventListener('change', e => {
  document.getElementById('status').textContent = e.target.checked
    ? 'Historien-Layer vorbereitet – Datenimport folgt'
    : 'Rail-Graph aktiv';
});

document.getElementById('locateBtn').addEventListener('click', () => map.locate({setView:true,maxZoom:12}));
map.on('locationfound', e =>
  L.circleMarker(e.latlng,{radius:8,fillOpacity:1}).bindPopup('Dein Standort').addTo(map).openPopup()
);

async function start() {
  renderTab('atlas');
  try {
    await loadGraph();
    renderTab('atlas');
    document.getElementById('routeBtn').click();
  } catch (error) {
    console.error(error);
    document.getElementById('status').textContent = 'Rail-Graph konnte nicht geladen werden';
  }
}

start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => {
      console.warn('Service Worker konnte nicht registriert werden:', err);
    });
  });
}
