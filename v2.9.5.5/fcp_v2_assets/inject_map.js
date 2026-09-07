const fs = require('fs');

const htmlFile = 'Football-Control-Panel-V.2.html';
const mapFile = 'new_map.svg';

let html = fs.readFileSync(htmlFile, 'utf8');
const mapSvg = fs.readFileSync(mapFile, 'utf8');

const startTag = '<svg viewBox="0 0 340 520" width="100%" height="auto" style="max-height: 400px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">';
const endTag = '</svg>';

const startIndex = html.indexOf(startTag);
if (startIndex !== -1) {
    const startContentIndex = startIndex + startTag.length;
    const endIndex = html.indexOf(endTag, startContentIndex);
    
    if (endIndex !== -1) {
        // We need to inject the texts for the regions, because my generated map doesn't have the text tags!
        // Wait, I should add the texts back!
        
        let newMap = mapSvg;
        
        // Add text tags for each region
        newMap = newMap.replace(/<g onclick="filterOnlineUsersByRegion\('เหนือ'\)".*?>\n(.*?)<\/g>/, 
            '<g onclick="filterOnlineUsersByRegion(\'เหนือ\')" style="cursor:pointer" onmouseover="this.querySelector(\'path\').style.filter=\'brightness(1.3)\'" onmouseout="this.querySelector(\'path\').style.filter=\'\'">\n$1\n<text x="130" y="65" fill="#fff" font-weight="bold" font-size="12" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">เหนือ</text>\n<text id="count-เหนือ" x="130" y="85" fill="#fbbf24" font-weight="bold" font-size="20" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">0</text>\n</g>');

        newMap = newMap.replace(/<g onclick="filterOnlineUsersByRegion\('อีสาน'\)".*?>\n(.*?)<\/g>/, 
            '<g onclick="filterOnlineUsersByRegion(\'อีสาน\')" style="cursor:pointer" onmouseover="this.querySelector(\'path\').style.filter=\'brightness(1.3)\'" onmouseout="this.querySelector(\'path\').style.filter=\'\'">\n$1\n<text x="235" y="140" fill="#fff" font-weight="bold" font-size="12" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">อีสาน</text>\n<text id="count-อีสาน" x="235" y="165" fill="#fbbf24" font-weight="bold" font-size="20" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">0</text>\n</g>');

        newMap = newMap.replace(/<g onclick="filterOnlineUsersByRegion\('ตะวันตก'\)".*?>\n(.*?)<\/g>/, 
            '<g onclick="filterOnlineUsersByRegion(\'ตะวันตก\')" style="cursor:pointer" onmouseover="this.querySelector(\'path\').style.filter=\'brightness(1.3)\'" onmouseout="this.querySelector(\'path\').style.filter=\'\'">\n$1\n<text x="78" y="185" fill="#fff" font-weight="bold" font-size="10" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">ตะวันตก</text>\n<text id="count-ตะวันตก" x="78" y="205" fill="#fbbf24" font-weight="bold" font-size="18" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">0</text>\n</g>');

        newMap = newMap.replace(/<g onclick="filterOnlineUsersByRegion\('กลาง'\)".*?>\n(.*?)<\/g>/, 
            '<g onclick="filterOnlineUsersByRegion(\'กลาง\')" style="cursor:pointer" onmouseover="this.querySelector(\'path\').style.filter=\'brightness(1.3)\'" onmouseout="this.querySelector(\'path\').style.filter=\'\'">\n$1\n<text x="140" y="195" fill="#fff" font-weight="bold" font-size="12" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">กลาง</text>\n<text id="count-กลาง" x="140" y="215" fill="#fbbf24" font-weight="bold" font-size="20" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">0</text>\n</g>');

        newMap = newMap.replace(/<g onclick="filterOnlineUsersByRegion\('ตะวันออก'\)".*?>\n(.*?)<\/g>/, 
            '<g onclick="filterOnlineUsersByRegion(\'ตะวันออก\')" style="cursor:pointer" onmouseover="this.querySelector(\'path\').style.filter=\'brightness(1.3)\'" onmouseout="this.querySelector(\'path\').style.filter=\'\'">\n$1\n<text x="190" y="235" fill="#fff" font-weight="bold" font-size="10" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">ตะวันออก</text>\n<text id="count-ตะวันออก" x="190" y="255" fill="#fbbf24" font-weight="bold" font-size="18" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">0</text>\n</g>');

        newMap = newMap.replace(/<g onclick="filterOnlineUsersByRegion\('ใต้'\)".*?>\n(.*?)<\/g>/, 
            '<g onclick="filterOnlineUsersByRegion(\'ใต้\')" style="cursor:pointer" onmouseover="this.querySelector(\'path\').style.filter=\'brightness(1.3)\'" onmouseout="this.querySelector(\'path\').style.filter=\'\'">\n$1\n<text x="100" y="350" fill="#fff" font-weight="bold" font-size="12" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">ใต้</text>\n<text id="count-ใต้" x="100" y="375" fill="#fbbf24" font-weight="bold" font-size="20" text-anchor="middle" style="pointer-events:none;text-shadow:1px 1px 3px rgba(0,0,0,.9)">0</text>\n</g>');

        const newHtml = html.substring(0, startContentIndex) + "\n" + newMap + "\n                    " + html.substring(endIndex);
        fs.writeFileSync(htmlFile, newHtml);
        console.log("Successfully replaced map in HTML");
    }
}
