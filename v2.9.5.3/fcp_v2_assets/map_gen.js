const https = require('https');
const fs = require('fs');

const regionMapping = {
  // North
  'Chiang Mai': 'เหนือ', 'Chiang Rai': 'เหนือ', 'Lampang': 'เหนือ', 'Lamphun': 'เหนือ', 'Mae Hong Son': 'เหนือ', 'Nan': 'เหนือ', 'Phayao': 'เหนือ', 'Phrae': 'เหนือ', 'Uttaradit': 'เหนือ',
  // Northeast
  'Amnat Charoen': 'อีสาน', 'Bueng Kan': 'อีสาน', 'Buri Ram': 'อีสาน', 'Chaiyaphum': 'อีสาน', 'Kalasin': 'อีสาน', 'Khon Kaen': 'อีสาน', 'Loei': 'อีสาน', 'Maha Sarakham': 'อีสาน', 'Mukdahan': 'อีสาน', 'Nakhon Phanom': 'อีสาน', 'Nakhon Ratchasima': 'อีสาน', 'Nong Bua Lam Phu': 'อีสาน', 'Nong Khai': 'อีสาน', 'Roi Et': 'อีสาน', 'Sakon Nakhon': 'อีสาน', 'Si Sa Ket': 'อีสาน', 'Surin': 'อีสาน', 'Ubon Ratchathani': 'อีสาน', 'Udon Thani': 'อีสาน', 'Yasothon': 'อีสาน',
  // Central (including BKK)
  'Ang Thong': 'กลาง', 'Ayutthaya': 'กลาง', 'Bangkok': 'กลาง', 'Chai Nat': 'กลาง', 'Kamphaeng Phet': 'กลาง', 'Lop Buri': 'กลาง', 'Nakhon Nayok': 'กลาง', 'Nakhon Pathom': 'กลาง', 'Nakhon Sawan': 'กลาง', 'Nonthaburi': 'กลาง', 'Pathum Thani': 'กลาง', 'Phetchabun': 'กลาง', 'Phichit': 'กลาง', 'Phitsanulok': 'กลาง', 'Phra Nakhon Si Ayutthaya': 'กลาง', 'Samut Prakan': 'กลาง', 'Samut Sakhon': 'กลาง', 'Samut Songkhram': 'กลาง', 'Saraburi': 'กลาง', 'Sing Buri': 'กลาง', 'Sukhothai': 'กลาง', 'Suphan Buri': 'กลาง', 'Uthai Thani': 'กลาง',
  // East
  'Chachoengsao': 'ตะวันออก', 'Chanthaburi': 'ตะวันออก', 'Chon Buri': 'ตะวันออก', 'Prachin Buri': 'ตะวันออก', 'Rayong': 'ตะวันออก', 'Sa Kaeo': 'ตะวันออก', 'Trat': 'ตะวันออก',
  // West
  'Kanchanaburi': 'ตะวันตก', 'Phetchaburi': 'ตะวันตก', 'Prachuap Khiri Khan': 'ตะวันตก', 'Ratchaburi': 'ตะวันตก', 'Tak': 'ตะวันตก',
  // South
  'Chumphon': 'ใต้', 'Krabi': 'ใต้', 'Nakhon Si Thammarat': 'ใต้', 'Narathiwat': 'ใต้', 'Pattani': 'ใต้', 'Phangnga': 'ใต้', 'Phatthalung': 'ใต้', 'Phuket': 'ใต้', 'Ranong': 'ใต้', 'Satun': 'ใต้', 'Songkhla': 'ใต้', 'Surat Thani': 'ใต้', 'Trang': 'ใต้', 'Yala': 'ใต้'
};

const url = "https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json";

function project(lon, lat) {
  // Simple linear mapping for Thailand
  // Bounding box: Lon 97.3 to 105.6, Lat 5.6 to 20.4
  const minLon = 97.3, maxLon = 105.7;
  const minLat = 5.6, maxLat = 20.5;
  
  const w = 340;
  const h = 520;
  
  const x = ((lon - minLon) / (maxLon - minLon)) * w;
  const y = h - ((lat - minLat) / (maxLat - minLat)) * h;
  return [x, y];
}

https.get(url, (res) => {
  let body = "";
  res.on("data", (chunk) => { body += chunk; });
  res.on("end", () => {
    try {
      const data = JSON.parse(body);
      const regions = { 'เหนือ': [], 'อีสาน': [], 'กลาง': [], 'ตะวันออก': [], 'ตะวันตก': [], 'ใต้': [] };
      
      data.features.forEach(f => {
        const name = f.properties.name;
        const region = regionMapping[name] || 'กลาง'; // default to Central
        
        let polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
        
        polys.forEach(poly => {
          poly.forEach(ring => {
            let path = "";
            ring.forEach((coord, i) => {
              // skip some points to simplify
              if (i % 2 !== 0 && i !== ring.length - 1) return;
              const [x, y] = project(coord[0], coord[1]);
              path += (i === 0 ? "M" : "L") + `${x.toFixed(1)},${y.toFixed(1)} `;
            });
            path += "Z";
            regions[region].push(path);
          });
        });
      });
      
      let svg = "";
      const colors = {
        'เหนือ': '#3b82f6',
        'อีสาน': '#10b981',
        'ตะวันตก': '#d946ef',
        'กลาง': '#f59e0b',
        'ตะวันออก': '#ef4444',
        'ใต้': '#06b6d4'
      };
      
      for (const [r, paths] of Object.entries(regions)) {
        svg += `<g onclick="filterOnlineUsersByRegion('${r}')" style="cursor:pointer" onmouseover="this.querySelector('path').style.filter='brightness(1.3)'" onmouseout="this.querySelector('path').style.filter=''">\n`;
        svg += `  <path d="${paths.join(" ")}" fill="${colors[r]}" stroke="#0f172a" stroke-width="0.5" style="transition:filter .2s"/>\n`;
        svg += `</g>\n`;
      }
      
      fs.writeFileSync('new_map.svg', svg);
      console.log("Map generated: new_map.svg");
      
    } catch (error) {
      console.error(error);
    }
  });
});
