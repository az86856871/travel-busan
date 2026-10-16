// 把 timetable/ 裡的 md 轉成時間表網頁。
// 用法（在專案根目錄）：node tools/build-timetable.js
// 產生：timetable.html（兩版合併）、timetable-hua.html、timetable-lcc.html
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FOOTER = '祝您旅途愉快 · 釜山見！🌊';

const VERSIONS = [
  { id: 'lcc', name: '廉價航空版' },
  { id: 'hua', name: '中華航空版' },
];

// ---------- md -> html ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s)
  .replace(/&lt;br&gt;/g, '<br>')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());

function convert(md) {
  const lines = md.split('\n');
  const out = [];
  let title = '';
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('# ')) { title = l.slice(2); i++; continue; }
    if (l.startsWith('## ')) { out.push(`<h3>${inline(l.slice(3))}</h3>`); i++; continue; }
    if (l.startsWith('> ')) { out.push(`<p class="note">${inline(l.slice(2))}</p>`); i++; continue; }
    if (l.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      let h = '<div class="tw"><table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
      for (const r of body) {
        h += '<tr>' + r.map((c, k) => k === 0
          ? `<td class="t" data-l="${esc(head[0])}">${inline(c)}</td>`
          : `<td data-l="${esc(head[k] || '')}">${inline(c)}</td>`).join('') + '</tr>';
      }
      out.push(h + '</tbody></table></div>');
      continue;
    }
    if (l.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) { items.push(lines[i].slice(2)); i++; }
      out.push('<ul>' + items.map(x => `<li>${inline(x)}</li>`).join('') + '</ul>');
      continue;
    }
    i++;
  }
  return { title, html: out.join('\n') };
}

for (const v of VERSIONS) {
  v.days = [1, 2, 3, 4].map(n => ({
    n,
    ...convert(fs.readFileSync(path.join(ROOT, 'timetable', `day${n}-${v.id}.md`), 'utf8')),
  }));
}

// ---------- 樣式與腳本 ----------
const CSS = `:root{--bg:#f4f9fc;--card:#fff;--ink:#1f2d3a;--muted:#5d6f7e;--primary:#0b7fab;--primary-d:#075a7a;--accent:#ff7a59;--line:#dbe8f0}
*{box-sizing:border-box}
body{margin:0;font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;background:var(--bg);color:var(--ink);line-height:1.7}
.hero{position:relative;background:linear-gradient(160deg,#0b7fab 0%,#12a6c9 55%,#7fd6e6 100%);color:#fff;padding:36px 20px 40px;text-align:center}
.hero .back{position:absolute;left:12px;top:10px;color:#fff;text-decoration:none;font-size:.8rem;background:rgba(255,255,255,.22);border-radius:999px;padding:2px 12px}
.hero .back:hover{background:rgba(255,255,255,.36)}
.hero h1{margin:0 0 6px;font-size:1.8rem}.hero p{margin:0;opacity:.95}
.wrap{max-width:820px;margin:0 auto;padding:0 16px}
.ver{padding:14px 0 4px}.ver .wrap{display:flex;gap:8px}
.ver button{flex:1;font:inherit;cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--primary-d);border-radius:12px;padding:8px 10px;font-weight:700}
.ver button.on{background:var(--accent);border-color:var(--accent);color:#fff}
nav{position:sticky;top:0;z-index:10;background:rgba(244,249,252,.95);backdrop-filter:blur(6px);padding:10px 0;border-bottom:1px solid var(--line)}
nav .wrap{display:flex;gap:8px;overflow-x:auto}
nav a{flex:1 0 auto;text-align:center;padding:8px 16px;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--primary-d);text-decoration:none;font-weight:600;white-space:nowrap}
nav a.on{background:var(--primary);color:#fff;border-color:var(--primary)}
.vsec{display:none}.vsec.on{display:block}
.day{display:none;padding:22px 0 40px}.day.on{display:block}
.day h2{margin:0 0 10px;font-size:1.4rem;color:var(--primary-d)}
.day h3{margin:26px 0 8px;color:var(--primary);font-size:1.05rem}
.note{background:#fff6ec;border-left:5px solid var(--accent);border-radius:10px;padding:10px 14px;margin:0 0 16px;color:#34495a;font-size:.93rem}
.tw{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:.95rem}
th{background:#e6f4fa;color:var(--primary-d);text-align:left;padding:8px 12px;white-space:nowrap}
td{padding:9px 12px;border-top:1px solid var(--line);vertical-align:top}
td.t{font-weight:700;color:var(--primary-d);white-space:nowrap}
td:nth-child(3){color:var(--muted);font-size:.9rem}
ul{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 16px 12px 34px;margin:0}
li{margin:4px 0}code{background:#eef4f8;border-radius:4px;padding:1px 5px}
footer{text-align:center;color:var(--muted);padding:20px 16px 40px;font-size:.9rem}
@media(max-width:600px){
 table,thead,tbody,tr,td{display:block;width:100%}thead{display:none}
 tr{padding:10px 12px;border-top:1px solid var(--line)}tr:first-child{border-top:0}
 td{border:0;padding:1px 0;white-space:normal!important}
 td.t{font-size:1.02rem}td:nth-child(3){font-size:.88rem}
 td[data-l]:not(.t)::before{content:attr(data-l) "：";color:var(--muted);font-size:.8rem}
 td:nth-child(2){font-weight:600}td:nth-child(2)::before{content:none}
}
@media print{nav,.ver{display:none}.vsec{display:block!important}.day{display:block!important;page-break-inside:avoid}}`;

const SCRIPT = `(function(){
  var vers=document.querySelectorAll('#vers button'),links=document.querySelectorAll('#tabs a');
  var ids=[].map.call(document.querySelectorAll('.vsec'),function(s){return s.id.slice(2)});
  var cur={v:ids[0],d:'d1'};
  if(ids.length>1){try{var sv=localStorage.getItem('busan-ver');if(ids.indexOf(sv)>=0)cur.v=sv}catch(x){}}
  function render(){
    vers.forEach(function(b){b.classList.toggle('on',b.getAttribute('data-v')===cur.v)});
    links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+cur.d)});
    document.querySelectorAll('.vsec').forEach(function(s){
      s.classList.toggle('on',s.id==='v-'+cur.v);
      s.querySelectorAll('.day').forEach(function(d){d.classList.toggle('on',d.getAttribute('data-d')===cur.d)});
    });
    try{history.replaceState(null,'','#'+(ids.length>1?cur.v+'-':'')+cur.d)}catch(x){}
  }
  vers.forEach(function(b){b.addEventListener('click',function(){
    cur.v=b.getAttribute('data-v');
    try{localStorage.setItem('busan-ver',cur.v)}catch(x){}
    render();window.scrollTo({top:0,behavior:'smooth'});
  })});
  links.forEach(function(a){a.addEventListener('click',function(e){
    e.preventDefault();cur.d=a.getAttribute('href').slice(1);render();window.scrollTo({top:0,behavior:'smooth'});
  })});
  var h=location.hash.slice(1),m=h.match(/^([a-z]+)-(d[1-4])$/)||h.match(/^()(d[1-4])$/);
  if(m){if(m[1]&&ids.indexOf(m[1])>=0)cur.v=m[1];cur.d=m[2]}
  render();
})();`;

// ---------- 組頁 ----------
function page({ versions, heading, backHref }) {
  const multi = versions.length > 1;
  const titleText = multi ? '釜山 4天3夜 每日時間表' : `釜山 4天3夜 每日時間表（${versions[0].name}）`;
  const h1 = multi ? '釜山 4天3夜・每日時間表' : `釜山 4天3夜・每日時間表（${versions[0].name}）`;
  const sub = multi ? '先選航空版本，再點 Day 切換；時間為推算值，出發前請再確認' : '點上方 Day 切換，時間為推算值，出發前請再確認';
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titleText}</title>
<style>${CSS}</style>
</head>
<body>
<header class="hero"><a class="back" href="${backHref}">← 回首頁</a><h1>${h1}</h1><p>${sub}</p></header>
${multi ? `<div class="ver"><div class="wrap" id="vers">${versions.map((v, i) => `<button type="button" data-v="${v.id}"${i === 0 ? ' class="on"' : ''}>${v.name}</button>`).join('')}</div></div>\n` : ''}<nav><div class="wrap" id="tabs">${[1, 2, 3, 4].map(n => `<a href="#d${n}"${n === 1 ? ' class="on"' : ''}>Day ${n}</a>`).join('')}</div></nav>
<main class="wrap">
${versions.map((v, i) => `<div class="vsec${i === 0 ? ' on' : ''}" id="v-${v.id}">${v.days.map(d => `<section class="day${d.n === 1 ? ' on' : ''}" data-d="d${d.n}">
<h2>${esc(d.title)}</h2>
${d.html}
</section>`).join('\n')}</div>`).join('\n')}
</main>
<footer>${FOOTER}</footer>
<script>${SCRIPT}</script>
</body>
</html>
`;
}

const write = (rel, content) => {
  fs.writeFileSync(path.join(ROOT, rel), content);
  console.log('wrote', rel, content.length);
};

write('timetable.html', page({ versions: VERSIONS, backHref: 'index.html' }));
for (const v of VERSIONS) {
  write(`timetable-${v.id}.html`, page({ versions: [v], backHref: 'index.html' }));
}
