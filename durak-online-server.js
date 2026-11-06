const http=require('http');const {Server}=require('socket.io');const PORT=process.env.PORT||3000;
const HTML=String.raw`<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Дурак Онлайн</title>
<script src="/socket.io/socket.io.js"></script>
<style>
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;font-family:system-ui,Arial;background:radial-gradient(circle at 50% 35%,#1d8a4e,#0a4a29 70%);color:#fff;overflow:hidden}
#app{height:100%;display:flex;flex-direction:column}
.top{display:flex;justify-content:center;gap:12px;padding:10px;flex-wrap:wrap}
.seat{background:#00000038;border:2px solid #ffffff22;border-radius:14px;padding:8px 12px;text-align:center;min-width:104px}
.seat.active{border-color:#ffd54f;box-shadow:0 0 14px #ffd54f55}
.avatar{width:40px;height:40px;border-radius:50%;background:#ffd54f;color:#3e2723;display:flex;align-items:center;justify-content:center;font-weight:900;margin:auto}
.name{font-size:13px;margin-top:4px}.cnt{font-size:12px;opacity:.85}
#felt{flex:1;position:relative;display:flex;align-items:center;justify-content:center}
#center{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap;max-width:94%}
#table{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-items:center;min-height:120px;max-width:70%}
.pair{position:relative;display:flex}
.card{width:56px;height:80px;background:linear-gradient(#fff,#f2f2f2);color:#111;border-radius:8px;padding:4px;font-weight:800;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 10px #0007;user-select:none;cursor:pointer;transition:.12s}
.card.red{color:#d32f2f}.card .mid{text-align:center;font-size:21px}
.card.dis{opacity:.55;cursor:not-allowed}
.def{position:absolute;right:-14px;bottom:-7px;transform:rotate(16deg)}
#deck{position:relative;width:56px;height:80px}
.back{position:absolute;inset:0;border-radius:8px;background:repeating-linear-gradient(45deg,#7b1fa2,#7b1fa2 6px,#5e1487 6px,#5e1487 12px);border:3px solid #fff;display:flex;align-items:center;justify-content:center}
.trump{position:absolute;left:9px;top:-12px;transform:rotate(-90deg);z-index:3}
@keyframes dealIn{from{transform:translateY(-220px) rotate(-28deg) scale(.65);opacity:0}to{transform:none;opacity:1}}
.deal{animation:dealIn .5s cubic-bezier(.2,.8,.25,1) both}
@keyframes flyOut{to{transform:translate(var(--fx),var(--fy)) rotate(38deg) scale(.5);opacity:0}}
.fly{animation:flyOut .55s ease-in forwards}
@keyframes pop{45%{transform:scale(1.2)}}
.pop{animation:pop .55s ease}
#bottom{padding:6px 10px 14px;display:flex;flex-direction:column;gap:8px;align-items:center}
#hand{display:flex;justify-content:center;min-height:100px;flex-wrap:wrap}
#hand .card{margin:0 -8px}
#hand .card:hover{transform:translateY(-10px)}
button{font:inherit;padding:11px 18px;border:0;border-radius:10px;background:#ffd54f;color:#3e2723;font-weight:900;cursor:pointer}
button:disabled{opacity:.45;cursor:not-allowed}
#msg{position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#000000a6;padding:8px 14px;border-radius:20px;font-weight:700;font-size:14px;max-width:94%;text-align:center;z-index:5}
.overlay{position:fixed;inset:0;background:#000000c4;display:flex;align-items:center;justify-content:center;padding:18px;z-index:10}
.box{background:#fff;color:#222;border-radius:16px;padding:22px;max-width:430px;width:100%;text-align:center}
input{font:inherit;padding:11px;border-radius:9px;border:1px solid #bbb;width:100%;margin:7px 0}
.hidden{display:none}
#invite{word-break:break-all;font-size:13px;background:#eee;color:#222;padding:8px;border-radius:8px}
@media(max-width:620px){.card{width:44px;height:63px}.card .mid{font-size:16px}.seat{min-width:84px;padding:6px}}
</style>
</head>
<body>
<div id="app">
<div class="top" id="seats"></div>
<div id="felt"><div id="msg"></div><div id="center"><div id="table"></div><div id="deck"><div class="back">🂠</div><div id="trump"></div></div></div></div>
<div id="bottom"><div style="display:flex;gap:10px"><button id="bito" onclick="send('pass')">Бито</button><button id="take" onclick="send('take')">Беру</button></div><div id="hand"></div></div>
</div>
<div id="join" class="overlay"><div class="box"><h2>🃏 Дурак Онлайн</h2><input id="name" placeholder="Ваше имя" maxlength="16"><input id="code" placeholder="Код комнаты" maxlength="4" style="text-transform:uppercase"><button style="width:100%" onclick="join()">Играть</button><p style="font-size:13px">Создатель комнаты получает ссылку-приглашение для друзей.</p></div></div>
<div id="room" class="overlay hidden"><div class="box"><h2>Комната <span id="codeBig"></span></h2><div id="players"></div><p>Отправьте друзьям ссылку:</p><div id="invite"></div><button style="width:100%;margin-top:10px" onclick="copyInvite()">Скопировать ссылку</button><button id="start" style="width:100%;margin-top:8px" onclick="send('startGame')">Начать игру</button></div></div>
<div id="end" class="overlay hidden"><div class="box"><h2 id="endTitle"></h2><p id="endText"></p></div></div>
<script>
const socket=io();let S=null;const el=i=>document.getElementById(i);
function send(e,d={}){socket.emit(e,d)}
function join(){const c=el('code').value.trim().toUpperCase();if(c)send('joinRoom',{code:c,name:el('name').value});else send('createRoom',{name:el('name').value})}
function copyInvite(){navigator.clipboard.writeText(el('invite').textContent)}
const q=new URLSearchParams(location.search);if(q.get('room'))el('code').value=q.get('room').toUpperCase();
socket.on('error',m=>{el('msg').textContent=m;setTimeout(()=>el('msg').textContent='',4000)});
socket.on('joined',d=>{el('join').classList.add('hidden');if(!S||!S.started){el('room').classList.remove('hidden');el('codeBig').textContent=d.code;el('invite').textContent=location.origin+'/?room='+d.code}});
socket.on('state',s=>{S=s;el('players').innerHTML=s.players.map(p=>\`<div style="margin:4px 0">\${p.name}\${p.id===s.you?' (вы)':''}</div>\`).join('');el('start').classList.toggle('hidden',!(s.host===s.you&&!s.started));el('start').disabled=s.players.length<2;if(!s.started)return;el('room').classList.add('hidden');el('seats').innerHTML=s.players.map(p=>\`<div class="seat \${p.id===s.attacker?'active':''}"><div class="avatar">\${p.name.slice(-1)}</div><div class="name">\${p.name}</div><div class="cnt">\${p.count}</div></div>\`).join('');el('table').innerHTML=s.table.map((p,i)=>\`<div class="pair">\${card(p.a,1,i*80)}\${p.d?card(p.d,1,i*80+120,'def'):''}</div>\`).join('');el('trump').innerHTML=s.deckCount?card(s.trump,1,200,'trump'):'';el('deck').style.display=s.deckCount?'block':'none';el('hand').innerHTML=s.hand.map((c,i)=>card(c,canPlay(c),i*70)).join('');const def=s.defender===s.you;el('bito').disabled=!(s.phase==='attack'&&s.attacker===s.you&&s.table.length||s.phase==='throw'&&!def&&s.table.length);el('take').disabled=!(def&&(s.phase==='defend'||s.phase==='throw')&&s.table.length);if(s.durak){const d=s.players.find(p=>p.id===s.durak);el('end').classList.remove('hidden');el('endTitle').textContent=s.winner==='draw'?'Ничья!':'Игра окончена';el('endText').textContent=s.winner==='draw'?'Все вышли одновременно.':'Дурак: '+(d?d.name:'—')}});
function canPlay(c){if(!S||!S.started)return false;const a=S.attacker===S.you,d=S.defender===S.you;if(S.phase==='attack')return a&&(S.table.length===0||S.table.some(p=>p.a.r===c.r||p.d&&p.d.r===c.r));if(S.phase==='defend')return d&&S.table.some(p=>!p.d);if(S.phase==='throw')return !d&&S.table.some(p=>p.a.r===c.r||p.d&&p.d.r===c.r);return false}
function card(c,ok,delay=0,cls=''){const red=(c.s==='♥'||c.s==='♦')?'red':'';return \`<div class="card \${red} \${ok?'':'dis'} \${cls} deal" style="animation-delay:\${delay}ms" onclick='pick("\${c.id}")'><div>\${c.r}\${c.s}</div><div class="mid">\${c.s}</div><div style="visibility:hidden">\${c.r}</div></div>\`}
function pick(id){if(!S||!S.started)return;if(S.phase==='attack')send('attack',{cardId:id});else if(S.phase==='defend')send('defend',{cardId:id});else if(S.phase==='throw')send('throw',{cardId:id})}
</script>
</body>
</html>`;
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(HTML)});
const io=new Server(server);const rooms=new Map();
const RANKS=['6','7','8','9','10','J','Q','K','A'],SUITS=['♠','♥','♦','♣'];
function deck(){const d=[];for(const s of SUITS)for(const r of RANKS)d.push({id:r+s+Math.random().toString(36).slice(2,8),r,s});for(let i=d.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]]}return d}
const rv=r=>RANKS.indexOf(r);const beats=(a,d,t)=>a.s===d.s?rv(d.r)>rv(a.r):d.s===t&&a.s!==t;
function state(room,id){const g=room.game;return {code:room.code,you:id,host:room.host,started:!!g,players:room.players.map(p=>({id:p.id,name:p.name,count:g?g.players.find(x=>x.id===p.id)?.hand.length??0:0})),hand:g?g.players.find(p=>p.id===id)?.hand||[]:[],table:g?g.table:[],trump:g?g.trump:null,deckCount:g?g.deck.length:0,attacker:g?g.players[g.att].id:null,defender:g?g.players[g.def].id:null,phase:g?g.phase:'lobby',winner:g?g.winner:null,durak:g?g.durak:null}}
const broadcast=r=>r.players.forEach(p=>io.to(p.id).emit('state',state(r,p.id)));
const roomOf=id=>[...rooms.values()].find(r=>r.players.some(p=>p.id===id));
function refill(r){const g=r.game;for(let i=0;i<g.players.length;i++){const p=g.players[(g.att+i)%g.players.length];while(p.hand.length<6&&g.deck.length)p.hand.push(g.deck.pop())}}
function finish(r,took){const g=r.game,d=g.players[g.def];if(took)for(const x of g.table){d.hand.push(x.a);if(x.d)d.hand.push(x.d)}g.table=[];refill(r);if(!g.deck.length){const left=g.players.filter(p=>p.hand.length);if(left.length===1){g.durak=left[0].id;g.winner=g.players.find(p=>!p.hand.length)?.id||null;broadcast(r);return}if(!left.length){g.winner='draw';broadcast(r);return}}if(!took)g.att=g.def;g.def=(g.att+1)%g.players.length;g.phase='attack';broadcast(r)}
function canAdd(r,p,c){const g=r.game;if(g.phase!=='attack'&&g.phase!=='throw')return false;const a=g.players[g.att].id===p.id,t=g.phase==='throw'&&g.players[g.def].id!==p.id;if(!a&&!t)return false;if(g.table.length>=6||g.table.length>=g.players[g.def].hand.length+1)return false;if(!g.table.length)return true;const ranks=new Set();g.table.forEach(x=>{ranks.add(x.a.r);if(x.d)ranks.add(x.d.r)});return ranks.has(c.r)}
io.on('connection',socket=>{
socket.on('createRoom',({name})=>{const code=Math.random().toString(36).slice(2,6).toUpperCase();const room={code,host:socket.id,game:null,players:[{id:socket.id,name:name||'Игрок'}]};rooms.set(code,room);socket.join(code);socket.emit('joined',{code});broadcast(room)});
socket.on('joinRoom',({code,name})=>{const room=rooms.get((code||'').toUpperCase());if(!room)return socket.emit('error','Комната не найдена');if(room.players.length>=4)return socket.emit('error','Комната заполнена');if(room.game)return socket.emit('error','Игра уже началась');room.players.push({id:socket.id,name:name||'Игрок'});socket.join(room.code);socket.emit('joined',{code:room.code});broadcast(room)});
socket.on('startGame',()=>{const room=roomOf(socket.id);if(!room||room.host!==socket.id||room.players.length<2)return socket.emit('error','Нужно минимум 2 игрока');const d=deck();room.game={deck:d,trump:d[d.length-1],table:[],att:Math.random()*room.players.length|0,phase:'attack',winner:null,durak:null,players:room.players.map(p=>({id:p.id,name:p.name,hand:[]}))};for(let i=0;i<6;i++)for(const p of room.game.players)p.hand.push(d.pop());room.game.def=(room.game.att+1)%room.game.players.length;broadcast(room)});
socket.on('attack',({cardId})=>{const room=roomOf(socket.id);if(!room?.game)return;const g=room.game,p=g.players.find(x=>x.id===socket.id),c=p?.hand.find(x=>x.id===cardId);if(!c||!canAdd(room,p,c))return socket.emit('error','Этой картой нельзя атаковать');p.hand=p.hand.filter(x=>x.id!==cardId);g.table.push({a:c,d:null});g.phase='defend';broadcast(room)});
socket.on('defend',({cardId})=>{const room=roomOf(socket.id);if(!room?.game)return;const g=room.game,p=g.players.find(x=>x.id===socket.id);if(!p||g.players[g.def].id!==socket.id||g.phase!=='defend')return socket.emit('error','Сейчас не ваша защита');const o=g.table.find(x=>!x.d),c=p.hand.find(x=>x.id===cardId);if(!o||!c)return socket.emit('error','Нет карты для защиты');if(!beats(o.a,c,g.trump.s))return socket.emit('error','Не бьёт '+o.a.r+o.a.s);p.hand=p.hand.filter(x=>x.id!==cardId);o.d=c;g.phase='throw';broadcast(room)});
socket.on('throw',({cardId})=>{const room=roomOf(socket.id);if(!room?.game)return;const g=room.game,p=g.players.find(x=>x.id===socket.id),c=p?.hand.find(x=>x.id===cardId);if(!c||g.phase!=='throw'||g.players[g.def].id===socket.id||!canAdd(room,p,c))return socket.emit('error','Эту карту нельзя подкинуть');p.hand=p.hand.filter(x=>x.id!==cardId);g.table.push({a:c,d:null});g.phase='defend';broadcast(room)});
socket.on('pass',()=>{const room=roomOf(socket.id);if(!room?.game)return;const g=room.game;const ok=(g.phase==='attack'&&g.players[g.att].id===socket.id&&g.table.length)||(g.phase==='throw'&&g.players[g.def].id!==socket.id&&g.table.length);if(!ok)return socket.emit('error','Сейчас нельзя сказать «Бито»');finish(room,false)});
socket.on('take',()=>{const room=roomOf(socket.id);if(!room?.game)return;const g=room.game;if(g.players[g.def].id!==socket.id||!['defend','throw'].includes(g.phase)||!g.table.length)return socket.emit('error','Берёт только защищающийся');finish(room,true)});
socket.on('disconnect',()=>{const room=roomOf(socket.id);if(!room)return;room.players=room.players.filter(p=>p.id!==socket.id);if(!room.players.length)return rooms.delete(room.code);if(room.game){room.game=null;io.to(room.code).emit('error','Игрок вышел. Создайте новую комнату.')}broadcast(room)});
});
server.listen(PORT,()=>console.log('Дурак онлайн: http://localhost:'+PORT));
