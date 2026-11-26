const fs = require('fs');
let html = fs.readFileSync('Football-Control-Panel-V.2.html', 'utf8');
const regions = ['เหนือ', 'อีสาน', 'กลาง', 'ตะวันออก', 'ตะวันตก', 'ใต้'];
const coords = {
  'เหนือ': {x: 85, y: 55},
  'อีสาน': {x: 230, y: 130},
  'กลาง': {x: 120, y: 140},
  'ตะวันออก': {x: 175, y: 220},
  'ตะวันตก': {x: 75, y: 180},
  'ใต้': {x: 75, y: 380}
};

for (const region of regions) {
  const c = coords[region];
  const regex = new RegExp(`(<g onclick="filterOnlineUsersByRegion\\('${region}'\\)"[^>]*>[\\s\\S]*?)(</g>)`);
  html = html.replace(regex, (match, p1, p2) => {
    if (match.includes('<text')) return match;
    return p1 + `  <text id="count-${region}" x="${c.x}" y="${c.y}" text-anchor="middle" fill="white" font-size="14px" font-weight="bold" style="pointer-events:none; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.8));">0</text>\n` + p2;
  });
}
fs.writeFileSync('Football-Control-Panel-V.2.html', html);
console.log('SVG text injected!');
