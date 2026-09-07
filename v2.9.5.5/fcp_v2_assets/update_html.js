const fs = require('fs');
let html = fs.readFileSync('Football-Control-Panel-V.2.html', 'utf8');

// Replace footer version
html = html.replace(
  'Version 2.9.4 (อัพเดต: 27 เม.ย. 2026)',
  'Version 2.9.4.1 (อัพเดต: 16 พ.ค. 2026)'
);

// Replace delete ID button with Donate button
const regexDelete = /<div id="deleteIdContainer"[\s\S]*?<\/div>/;

const newDonateDiv = `            <div style="margin-top: 15px; text-align: center;">
                <a href="https://easydonate.app/" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; text-decoration: none; font-weight: bold; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"><i class="fas fa-hand-holding-heart"></i> สนับสนุนการพัฒนาโปรแกรม (Donate)</a>
            </div>`;

html = html.replace(regexDelete, newDonateDiv);

fs.writeFileSync('Football-Control-Panel-V.2.html', html);
console.log('HTML updated successfully');
