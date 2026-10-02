const map = L.map('map', { zoomControl: true }).setView([49.6, 9.6], 7);
const base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const orm = L.tileLayer('https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: 'Railway overlay &copy; OpenRailwayMap contributors'
}).addTo(map);

const route = [
  { name:'Heilbronn Hbf', lat:49.1421, lon:9.2081, time:'08:02', line:'Start', note:'DB InfraGO · elektrifiziert' },
  { name:'Bad Friedrichshall Hbf', lat:49.2308, lon:9.2198, time:'08:14', line:'RE', note:'Knotenpunkt' },
  { name:'Osterburken', lat:49.4297, lon:9.4227, time:'08:49', line:'RE', note:'Übergang Frankenbahn' },
  { name:'Lauda', lat:49.5650, lon:9.7090, time:'09:16', line:'RE', note:'Betriebsstelle / Abzweig' },
  { name:'Würzburg Hbf', lat:49.8019, lon:9.9357, time:'09:53', line:'Ziel', note:'Fernverkehrsknoten' }
];

let routeLayer = L.layerGroup().addTo(map);
let trainMarker = null;

function drawRoute() {
  routeLayer.clearLayers();
  const coords = route.map(p => [p.lat, p.lon]);
  L.polyline(coords, { weight: 6, opacity: .9 }).addTo(routeLayer);
  route.forEach(p => {
    L.circleMarker([p.lat,p.lon], { radius: 6, weight: 2, fillOpacity: 1 })
      .bindPopup(`<b>${p.name}</b><br>${p.time}<br>${p.note}`)
      .addTo(routeLayer);
  });
  map.fitBounds(coords, { padding:[30,30] });
  document.querySelector('[data-tab="route"]').click();
  updateTimeline(0);
}

function renderTab(tab) {
  const el = document.getElementById('tabContent');
  if (tab === 'atlas') {
    el.innerHTML = `
      <h3>Atlas</h3>
      <div class="card">Interaktiver Europa-Bahnatlas auf Basis offener Geodaten. Der aktuelle MVP nutzt OSM + OpenRailwayMap als sichtbare Kartengrundlage.</div>
      <div class="kv">
        <span>Gebiet</span><span>Europa-ready</span>
        <span>Testregion</span><span>Heilbronn → Würzburg</span>
        <span>Historie</span><span>vorbereitet</span>
        <span>Fahrplan</span><span>Demo</span>
      </div>`;
  } else if (tab === 'route') {
    el.innerHTML = `<h3>Route</h3>` + route.map(p=>`
      <div class="card"><b>${p.time} · ${p.name}</b><br><span>${p.line} · ${p.note}</span></div>`).join('') + `
      <div class="card"><b>Nächster Schritt</b><br>Echter Rail-Graph aus OSM/ERA und VzG-/Infrastrukturdaten statt Demo-Geometrie.</div>`;
  } else {
    el.innerHTML = `<h3>Zeitplan</h3><div class="card">Demo-Fahrplan entlang derselben Infrastrukturroute.</div>` + route.map(p=>`
      <div class="kv"><span>${p.name}</span><span>${p.time}</span></div>`).join('');
  }
}

document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTab(btn.dataset.tab);
}));

function interpolate(a,b,t){ return [a.lat+(b.lat-a.lat)*t, a.lon+(b.lon-a.lon)*t]; }
function updateTimeline(v) {
  const x = Number(v)/100;
  const seg = Math.min(route.length-2, Math.floor(x*(route.length-1)));
  const local = x*(route.length-1)-seg;
  const pos = interpolate(route[seg], route[seg+1], local);
  if (!trainMarker) trainMarker = L.circleMarker(pos, { radius:9, weight:3, fillOpacity:1 }).addTo(routeLayer);
  else trainMarker.setLatLng(pos);
  const nearest = route[Math.round(x*(route.length-1))];
  document.getElementById('timelineLabel').textContent = `${nearest.name} · ${nearest.time}`;
}

document.getElementById('timeline').addEventListener('input', e => updateTimeline(e.target.value));
document.getElementById('routeBtn').addEventListener('click', () => {
  const from = document.getElementById('fromInput').value.trim();
  const to = document.getElementById('toInput').value.trim();
  document.getElementById('status').textContent = (from === 'Heilbronn Hbf' && to === 'Würzburg Hbf') ? 'Demo-Route aktiv' : 'MVP: derzeit Referenzroute Heilbronn → Würzburg';
  drawRoute();
});

document.getElementById('ormToggle').addEventListener('change', e => e.target.checked ? orm.addTo(map) : map.removeLayer(orm));
document.getElementById('historicToggle').addEventListener('change', e => {
  document.getElementById('status').textContent = e.target.checked ? 'Historien-Layer vorbereitet – Datenimport folgt' : 'MVP-Demo';
});

document.getElementById('locateBtn').addEventListener('click', () => map.locate({setView:true,maxZoom:12}));
map.on('locationfound', e => L.circleMarker(e.latlng,{radius:8,fillOpacity:1}).bindPopup('Dein Standort').addTo(map).openPopup());

renderTab('atlas');
drawRoute();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => {
      console.warn('Service Worker konnte nicht registriert werden:', err);
    });
  });
}