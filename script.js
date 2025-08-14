const startBtn = document.getElementById('clickableCircle');
const home = document.getElementById('home');
const mapWrap = document.getElementById('mapWrap');
const hudHolding = document.getElementById('holding');
const hudPlayerPos = document.getElementById('playerPos');
const hudNearest = document.getElementById('nearestItem');

let map, playerMarker, holding = null, arrowLine = null;
let keys = {w:false,s:false,a:false,d:false};
const PLAYER_SPEED = 0.0009;
const PICKUP_RADIUS = 0.004;
const ITEM_RADIUS = 0.09;

let geoData = [];
let player = {lat:41.015137,lng:28.979530};

// LocalStorage’dan yükle
let saved = localStorage.getItem('gameState');
if(saved){
  try{
    let parsed = JSON.parse(saved);
    if(parsed.player) player = parsed.player;
    if(Array.isArray(parsed.geoData)) geoData = parsed.geoData;
  }catch(e){ console.warn('LocalStorage yükleme hatası', e); }
}

// Başlat
startBtn.addEventListener('click', ()=>{
  home.style.display = 'none';
  mapWrap.style.display = 'block';
  loadObjects();
});

// Örnek nesneler (dosyadan JSON olarak da yüklenebilir)
function loadObjects(){
    if(geoData.length === 0){
        // Eğer boşsa rastgele nesneler
        const types = ['Star','Heart','Diamond','Circle','Triangle','Hexagon'];
        const colors = ['gold','red','blue','purple','green','orange'];
        for(let i=0;i<300;i++){
          let lat = 36 + Math.random()*5; // Türkiye genel alanı
          let lng = 26 + Math.random()*7;
          geoData.push({
            id:'item'+i,
            type: types[i % types.length],
            color: colors[i % colors.length],
            coords:[lat,lng]
          });
        }
    }
  initMap();
}

function initMap(){
  map = L.map('map', {
    zoom: 12,
    minZoom: 12,
    maxZoom: 12,
    zoomControl: false,
    dragging: true,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    touchZoom: false,
    keyboard: true
  }).setView([player.lat, player.lng],12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  playerMarker = L.circleMarker([player.lat, player.lng],{radius:16,color:'red',fillColor:'red',fillOpacity:1}).addTo(map);

  geoData.forEach(f=>{
    while(geoData.some(other=>other.id!==f.id && dist(f.coords[0],f.coords[1],other.coords[0],other.coords[1])<ITEM_RADIUS)){
      f.coords[0] += (Math.random()-0.5)*ITEM_RADIUS;
      f.coords[1] += (Math.random()-0.5)*ITEM_RADIUS;
    }
    f.marker = L.circleMarker(f.coords,{radius:8,color:f.color,fillColor:f.color,fillOpacity:0.9}).addTo(map)
              .bindTooltip(f.type,{permanent:false,direction:'top'});
  });

  requestAnimationFrame(gameLoop);
}

// Tuş kontrolleri
document.body.addEventListener('keydown', e=>{
  switch(e.code){
    case 'KeyW': case 'ArrowUp': keys.w=true; break;
    case 'KeyS': case 'ArrowDown': keys.s=true; break;
    case 'KeyA': case 'ArrowLeft': keys.a=true; break;
    case 'KeyD': case 'ArrowRight': keys.d=true; break;
    case 'KeyQ': // Al
      if(!holding){
        for(let f of geoData){
          if(dist(player.lat,player.lng,f.coords[0],f.coords[1])<PICKUP_RADIUS){
            holding = f;
            hudHolding.textContent = f.type;
            f.marker.setStyle({radius:12,opacity:0.6});
            saveData();
            break;
          }
        }
      }
      break;
    case 'KeyE': // Bırak
      if(holding){
        holding.marker.setStyle({radius:8,opacity:0.9});
        holding = null;
        hudHolding.textContent = 'Yok';
        saveData();
      }
      break;
  }
});

document.body.addEventListener('keyup', e=>{
  switch(e.code){
    case 'KeyW': case 'ArrowUp': keys.w=false; break;
    case 'KeyS': case 'ArrowDown': keys.s=false; break;
    case 'KeyA': case 'ArrowLeft': keys.a=false; break;
    case 'KeyD': case 'ArrowRight': keys.d=false; break;
  }
});

// En yakın nesneyi bul
function getNearestItem(){
  let nearest = null;
  let minDist = Infinity;
  geoData.forEach(item=>{
    if(item !== holding){
      let d = dist(player.lat,player.lng,item.coords[0],item.coords[1]);
      if(d < minDist){
        minDist = d;
        nearest = item;
      }
    }
  });
  return nearest;
}

// En yakın nesne göstergesini güncelle
function updateNearestIndicator(){
  let nearest = getNearestItem();
  if(nearest){
    hudNearest.textContent = `En yakın nesne: ${nearest.type}`;
    if(!arrowLine){
      arrowLine = L.polyline([ [player.lat, player.lng], nearest.coords ], {color:'lime', weight:2, dashArray:'5,5'}).addTo(map);
    } else {
      arrowLine.setLatLngs([ [player.lat, player.lng], nearest.coords ]);
    }
  } else {
    hudNearest.textContent = 'En yakın nesne: Yok';
    if(arrowLine){
      map.removeLayer(arrowLine);
      arrowLine = null;
    }
  }
}

// Oyun döngüsü
function gameLoop(){
  if(keys.w) player.lat += PLAYER_SPEED;
  if(keys.s) player.lat -= PLAYER_SPEED;
  if(keys.a) player.lng -= PLAYER_SPEED;
  if(keys.d) player.lng += PLAYER_SPEED;

  playerMarker.setLatLng([player.lat, player.lng]);
  map.setView([player.lat, player.lng]);

  hudPlayerPos.textContent = `Konum: ${player.lat.toFixed(5)}, ${player.lng.toFixed(5)}`;

  if(holding){
    let cur = holding.marker.getLatLng();
    let nx = cur.lat + (player.lat - cur.lat)*0.3;
    let ny = cur.lng + (player.lng - cur.lng)*0.3;
    holding.marker.setLatLng([nx, ny]);
    holding.coords = [nx, ny];
  }

  updateNearestIndicator();
  saveData();
  requestAnimationFrame(gameLoop);
}

// Yardımcı fonksiyonlar
function dist(lat1,lng1,lat2,lng2){ return Math.hypot(lat1-lat2, lng1-lng2); }

function saveData(){
  try{
    const state = {
      player: player,
      geoData: geoData.map(f=>({coords:f.coords, id:f.id, type:f.type, color:f.color}))
    };
    localStorage.setItem('gameState', JSON.stringify(state));
  }catch(e){ console.warn('LocalStorage kaydedilemedi.',e); }
}