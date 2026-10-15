'use strict';
const ITEMS=RAW.split('\n').map((l,i)=>{const [n,c,t]=l.split('|');return{id:i,n,c,t:t||''}});
const N=ITEMS.length,KEY='acq-pages-v1';
const POOL_BS=['당좌자산','재고자산','투자자산','유형자산','무형자산','기타비유동자산','유동부채','비유동부채','자본금','자본잉여금','자본조정','기타포괄손익누계액','이익잉여금'];
const POOL_IS=['영업외수익','영업외비용','판매비와일반관리비','매출원가','법인세비용'];
const TOP={};for(const k in CAT){const p=CAT[k];TOP[p[p.length-1]]=p[0]}
Object.assign(TOP,{자본금:'자본',이익잉여금:'자본',매출원가:'비용',법인세비용:'비용'});
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const norm=s=>s.replace(/[\s>›→\-·,.]/g,'').toLowerCase();
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const last=it=>CAT[it.c][CAT[it.c].length-1];
const pathOf=it=>(BS.includes(it.c)?'재무상태표':'손익계산서')+' › '+CAT[it.c].join(' › ');
function judge(it,inp){const n=norm(inp);let b=null;for(const k in AL)for(const a of AL[k])if(n.includes(a)){const s=a.length*10+(DET.has(k)?1:0);if(!b||s>b.s)b={k,s}}
 if(!b)return 'x';const p=CAT[it.c];if(b.k===p[p.length-1])return 'o';if(p.includes(b.k))return 'h';return 'x'}
function makeChoices(it){const ans=last(it),pool=(BS.includes(it.c)?POOL_BS:POOL_IS).filter(n=>n!==ans);
 const same=shuf(pool.filter(n=>TOP[n]===TOP[ans])),rest=shuf(pool.filter(n=>TOP[n]!==TOP[ans]));
 return shuf([ans,...same.concat(rest).slice(0,3)])}
const allIds=()=>ITEMS.map(i=>i.id);
function fresh(){return{type:'sub',mode:'all',order:shuf(allIds()),idx:0,res:{},ans:{},ch:{},st:{}}}
let S,tab='quiz',storeOK=true,askReset=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){storeOK=false}}
function load(){try{const raw=localStorage.getItem(KEY);if(raw){const s=JSON.parse(raw);if(s&&Array.isArray(s.order)&&s.order.length&&s.res&&s.st&&s.ch)return s}}catch(e){storeOK=false}return null}
const wrongIds=()=>allIds().filter(i=>S.st[i]&&S.st[i].rev==='pending');
const doneIds=()=>allIds().filter(i=>S.st[i]&&S.st[i].rev==='done');
function record(id,r){const e=S.st[id]||(S.st[id]={c:0,w:0,last:'',rev:''});
 if(r==='o'){e.c++;if(e.rev==='pending')e.rev='done';e.last='o'}else{e.w++;e.last='x';e.rev='pending'}}
function answer(v){const id=S.order[S.idx];if(S.res[id])return;const it=ITEMS[id];
 const r=(S.type==='obj'&&S.ch[id])?(v===last(it)?'o':'x'):judge(it,v);
 S.res[id]=r;S.ans[id]=v;record(id,r);save();render()}
function submitSub(){const v=document.getElementById('ans').value.trim();if(v)answer(v)}
function pick(i){answer(S.ch[S.order[S.idx]][i])}
function setType(t){S.type=t;save();render()}
function setTab(t){tab=t;render()}
function go(d){const n=S.idx+d;if(n<0||n>=S.order.length)return;S.idx=n;save();render()}
function shuffle(){S.order=shuf(S.order);S.idx=0;save();render()}
function allAgain(){S.mode='all';S.order=shuf(allIds());S.idx=0;S.res={};S.ans={};S.ch={};save();setTab('quiz')}
function wrongOnly(){const w=wrongIds();if(!w.length){alert('복습할 오답이 없습니다.');return}S.mode='wrong';S.order=shuf(w);S.idx=0;S.res={};S.ans={};S.ch={};save();setTab('quiz')}
function reset(ok){askReset=false;if(ok){S=fresh();tab='quiz';save()}render()}
function stats(){const v=Object.values(S.st),c=v.reduce((a,e)=>a+e.c,0),w=v.reduce((a,e)=>a+e.w,0),r=c+w?Math.round(c/(c+w)*100):0;
 const d=S.order.filter(i=>S.res[i]).length,p=Math.round(d/S.order.length*100);
 return `<div class="stats"><div><b>${N}</b>전체</div><div><b>${v.length}</b>푼 문제</div><div><b class="ok">${c}</b>정답</div><div><b class="no">${w}</b>오답</div><div><b>${r}%</b>정답률</div></div>
 <div class="mu">이번 세트 진행 ${d} / ${S.order.length}</div><div class="bar"><i style="width:${p}%"></i></div>`}
function result(it,r,v){const h=r==='o'?'<div class="badge ok">✔ 정답</div>':r==='h'?`<div class="badge wa">△ 상위 분류만 맞음</div><div class="mu">입력: ${esc(v)} — 세부 분류까지 입력해야 합니다.</div>`:`<div class="badge no">✘ 오답</div><div class="mu">답: ${esc(v)}</div>`;
 return h+`<div class="path">${esc(it.n)} → ${pathOf(it)}</div><div>${RULE[it.c]}</div>`+(it.t?`<div class="mu" style="margin-top:6px">참고: ${esc(it.t)}</div>`:'')}
function render(){const a=document.getElementById('app');
 const tb=`<h1>계정과목 분류 암기 퀴즈</h1><div class="tabs">${[['quiz','퀴즈'],['notes','오답노트('+wrongIds().length+')'],['list','분류 목록']].map(([k,l])=>`<button class="${tab===k?'on':'s'}" onclick="setTab('${k}')">${l}</button>`).join('')}</div>`;
 const rs=askReset?`<div class="card"><b>기록을 모두 지울까요?</b><p class="mu">풀이 기록, 오답노트, 복습 상태가 삭제되며 되돌릴 수 없습니다.</p><div class="row"><button class="s" onclick="reset(false)">취소</button><button class="danger" onclick="reset(true)">초기화</button></div></div>`:`<button class="s" onclick="askReset=true;render()">기록 초기화</button>`;
 const foot=rs+`<p class="mu c">${storeOK?'학습 기록은 이 기기·브라우저에만 저장되며 다른 사람에게 보이지 않습니다.':'⚠ 이 브라우저에서는 기록을 저장할 수 없습니다(시크릿 모드 등).'}</p>`;
 let body='';
 if(tab==='quiz'){const id=S.order[S.idx],it=ITEMS[id],r=S.res[id],v=S.ans[id]||'',obj=S.type==='obj';
  if(obj&&!S.ch[id]){S.ch[id]=makeChoices(it);save()}
  const set=S.order,ok=set.filter(i=>S.res[i]==='o').length,done=set.every(i=>S.res[i]);
  const input=obj?(S.ch[id]||[]).map((c,i)=>`<button class="s ch ${r?(c===last(it)?'good':(c===v?'bad':'')):''}" onclick="pick(${i})" ${r?'disabled':''}>${esc(c)}</button>`).join(''):`<input id="ans" type="text" autocomplete="off" autocapitalize="off" placeholder="정답 입력" value="${esc(v)}" ${r?'disabled':''}><button onclick="submitSub()" ${r?'disabled':''}>정답 확인</button>`;
  body=`<div class="row"><button class="${obj?'s':'on'}" onclick="setType('sub')">주관식</button><button class="${obj?'on':'s'}" onclick="setType('obj')">객관식</button></div><div style="height:10px"></div>${stats()}
  <div class="card"><div class="mu c">${S.mode==='wrong'?'오답 복습 · ':''}${S.idx+1} / ${set.length}번</div><div class="q">${esc(it.n)}</div><div class="mu c">${obj?'알맞은 분류를 고르세요':'세부 분류를 입력하세요 (예: 유형자산, 영업외비용)'}</div>${input}${r?`<div style="margin-top:12px">${result(it,r,v)}</div>`:''}</div>
  <div class="row"><button class="s" onclick="go(-1)" ${S.idx===0?'disabled':''}>◀ 이전 문제</button><button onclick="go(1)" ${S.idx>=set.length-1?'disabled':''}>다음 문제 ▶</button></div>
  ${done?`<div class="card c" style="margin-top:10px"><b class="ok">이번 세트 완료: ${ok} / ${set.length} 정답</b>${wrongIds().length?`<button onclick="wrongOnly()">남은 오답 ${wrongIds().length}개 다시 풀기</button>`:'<p class="mu">남은 오답이 없습니다.</p>'}</div>`:''}
  <div class="row"><button class="s" onclick="shuffle()">순서 섞기</button><button class="s" onclick="allAgain()">전체 다시 풀기</button><button class="s" onclick="wrongOnly()">오답만 풀기</button></div>`}
 else if(tab==='notes'){const w=wrongIds(),d=doneIds();body=`<div class="card"><b>복습할 오답 (${w.length})</b><p class="mu">틀린 문제가 자동 저장되고, 이후 맞히면 복습 완료로 바뀝니다.</p>${w.length?'<table>'+w.map(i=>`<tr><td><b>${esc(ITEMS[i].n)}</b></td><td>${esc(pathOf(ITEMS[i]).replace('재무상태표 › ','').replace('손익계산서 › ',''))}<div class="mu">오답 ${S.st[i].w}회 · 정답 ${S.st[i].c}회</div></td></tr>`).join('')+'</table>':'<p class="c">복습할 오답이 없습니다.</p>'}<button onclick="wrongOnly()">오답만 다시 풀기</button></div>
  <div class="card"><b>복습 완료 (${d.length})</b>${d.length?`<p class="mu">${d.map(i=>esc(ITEMS[i].n)).join(', ')}</p>`:'<p class="mu">아직 없습니다.</p>'}</div>`}
 else{body=`<div class="card"><b>추출·분류 목록 (${N}개)</b><p class="mu">첨부한 재무상태표·손익계산서 계정 분류표와 대조해 검수한 결과입니다. ※ 표시는 분류표에 없거나 표기가 다른 항목입니다.</p><table>`+ITEMS.map(it=>`<tr><td>${esc(it.n)}</td><td>${esc(CAT[it.c].join(' › '))}${it.t?' <span class="flag">※'+esc(it.t)+'</span>':''}</td></tr>`).join('')+'</table></div>'}
 a.innerHTML=tb+body+foot;
 const i=document.getElementById('ans');if(i&&!i.disabled)i.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing)submitSub()});
}
S=load()||fresh();render();
