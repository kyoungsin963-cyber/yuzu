/* report.js v5 - Yuzu Kitchen Weekly Report */
(function(){
var _a='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
var _b='eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZHJxeWNnZGNtd25xZ2FodnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNTc0NzMsImV4cCI6MjA4NzgzMzQ3M30';
var _c='_a88kW2GGWq4KFvcEnkWiu-Eo87wPBK2Y_im77gf0SE';
var SBK=[_a,_b,_c].join('.');
var SBU='https://hcdrqycgdcmwnqgahvqc.supabase.co';

var PS=[
  {name:'쉐프',role:'주방 총괄',av:'셰',bg:'#E1F5EE',co:'#085041'},
  {name:'점장',role:'홀 총괄',av:'점',bg:'#E6F1FB',co:'#0C447C'},
  {name:'진보과장',role:'운영 관리',av:'진',bg:'#FAEEDA',co:'#633806'},
  {name:'경신차장',role:'관리 지원',av:'경',bg:'#EEEDFE',co:'#3C3489'},
  {name:'현준선임',role:'서비스 관리',av:'현',bg:'#FAECE7',co:'#712B13'}
];

function sbq(path,opts){
  var h={'apikey':SBK,'Authorization':'Bearer '+SBK,'Content-Type':'application/json','Prefer':'return=representation'};
  if(opts&&opts.headers)Object.keys(opts.headers).forEach(function(k){h[k]=opts.headers[k];});
  return fetch(SBU+'/rest/v1/'+path,Object.assign({},opts,{headers:h})).then(function(r){return r.json();});
}
function monday(off){
  var d=new Date(),day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);
  return new Date(new Date(d).setDate(diff+(off||0)*7)).toISOString().slice(0,10);
}
function wlabel(off){
  var d=new Date(),day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);
  var mon=new Date(new Date(d).setDate(diff+(off||0)*7));
  var sun=new Date(mon);sun.setDate(mon.getDate()+6);
  var fmt=function(x){return (x.getMonth()+1)+'/'+(('0'+x.getDate()).slice(-2));};
  return{t:(mon.getMonth()+1)+'월 '+Math.ceil(mon.getDate()/7)+'주차',s:fmt(mon)+' - '+fmt(sun)};
}

var wOff=0,curPart='k',curPerson=0,editOn=false;
var RC={k:[],h:[],s:[]};
var CMTS=['','','','',''];
var partMap={k:'kitchen',h:'hall',s:'service'};
var partColor={k:'#1D9E75',h:'#378ADD',s:'#D85A30'};
var partName={k:'주방',h:'홀',s:'서비스'};

function g(id){return document.getElementById(id);}
function st(id,v){var e=g(id);if(e)e.textContent=v;}
function sh(id,d){var e=g(id);if(e)e.style.display=d||'block';}
function hd(id){var e=g(id);if(e)e.style.display='none';}
function msg(t,c){var m=g('rMsg');if(m){m.textContent=t;m.style.color=c||'#1D9E75';setTimeout(function(){m.textContent='';},3000);}}

window.sh=sh;window.hd=hd;

function buildUI(){
  var panel=g('tab-report');
  if(!panel)return;
  var l=wlabel(wOff);
  var h='';

  h+='<div style="padding:0 0 1.5rem;position:relative">';

  // 헤더
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">';
  h+='<div style="display:flex;align-items:center;gap:10px">';
  h+='<button onclick="rW(-1)" style="width:30px;height:30px;border-radius:50%;border:0.5px solid #ddd;background:var(--bg,#fff);cursor:pointer;font-size:16px;color:var(--text,#333)">&#8249;</button>';
  h+='<div><div id="rWt" style="font-size:15px;font-weight:500">'+l.t+'</div>';
  h+='<div id="rWs" style="font-size:11px;color:#888">'+l.s+'</div></div>';
  h+='<button onclick="rW(1)" style="width:30px;height:30px;border-radius:50%;border:0.5px solid #ddd;background:var(--bg,#fff);cursor:pointer;font-size:16px;color:var(--text,#333)">&#8250;</button>';
  h+='</div>';
  h+='<div style="display:flex;gap:8px;align-items:center">';
  h+='<span id="rBadge" style="font-size:11px;padding:4px 10px;border-radius:20px;background:#FCEBEB;color:#A32D2D;font-weight:500;display:none">미해결</span>';
  h+='<button onclick="rSaveAll()" style="padding:8px 20px;border-radius:8px;background:#1D9E75;color:#fff;border:none;font-size:13px;font-weight:500;cursor:pointer">전체 저장</button>';
  h+='</div></div>';

  // 점수 카드
  h+='<div style="font-size:11px;font-weight:500;color:#aaa;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">이번 주 점수</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px">';
  var partLabels={k:'🍳 주방',h:'🪑 홀',s:'⭐ 서비스'};
  ['k','h','s'].forEach(function(pt){
    var c=partColor[pt];
    h+='<div id="sc-'+pt+'" onclick="rPart(''+pt+'')" style="background:var(--bg,#fff);border-radius:12px;border:0.5px solid #ddd;padding:12px 14px;text-align:center;cursor:pointer">';
    h+='<div style="font-size:11px;color:#888;margin-bottom:5px">'+partLabels[pt]+'</div>';
    h+='<div id="scN-'+pt+'" style="font-size:26px;font-weight:500;color:'+c+'">-</div>';
    h+='<div style="height:4px;background:#eee;border-radius:2px;margin:7px 0 4px;overflow:hidden">';
    h+='<div id="scB-'+pt+'" style="height:4px;border-radius:2px;background:'+c+';width:0%;transition:width .3s"></div></div>';
    h+='<div id="scS-'+pt+'" style="font-size:10px;color:#aaa"></div></div>';
  });
  h+='</div>';

  // 항목 입력 패널
  h+='<div style="font-size:11px;font-weight:500;color:#aaa;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">항목별 평가 입력</div>';
  h+='<div style="background:var(--bg,#fff);border-radius:12px;border:0.5px solid #ddd;overflow:hidden;margin-bottom:12px">';
  h+='<div style="display:flex;border-bottom:0.5px solid #ddd;align-items:center">';
  h+='<button id="ptab-k" onclick="rPart('k')" style="padding:10px 16px;font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid #1D9E75;border-top:none;border-left:none;border-right:none;background:none;color:#0F6E56;margin-bottom:-0.5px">🍳 주방</button>';
  h+='<button id="ptab-h" onclick="rPart('h')" style="padding:10px 16px;font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;border-top:none;border-left:none;border-right:none;background:none;color:#888;margin-bottom:-0.5px">🪑 홀</button>';
  h+='<button id="ptab-s" onclick="rPart('s')" style="padding:10px 16px;font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;border-top:none;border-left:none;border-right:none;background:none;color:#888;margin-bottom:-0.5px">⭐ 서비스</button>';
  h+='<button id="rEditBtn" onclick="rToggleEdit()" style="margin-left:auto;margin-right:12px;padding:4px 10px;font-size:11px;border-radius:4px;background:none;border:0.5px solid #ddd;cursor:pointer;color:#888">✏️ 편집</button>';
  h+='</div>';
  h+='<div id="rItemsWrap"></div>';
  h+='<div style="padding:8px 16px;border-top:0.5px solid #eee;display:flex;align-items:center;gap:8px">';
  h+='<span id="rMemoLbl" style="font-size:11px;color:#aaa;flex-shrink:0">주방 메모</span>';
  h+='<input id="rMemo" placeholder="이번 주 특이사항..." style="flex:1;padding:5px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333)">';
  h+='</div>';
  h+='<div id="rAddRow" style="display:none;padding:8px 16px;border-top:0.5px solid #eee;align-items:center;gap:8px">';
  h+='<input id="rNewName" placeholder="새 항목명..." style="flex:1;padding:5px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333)">';
  h+='<select id="rNewType" style="padding:5px 8px;border-radius:5px;border:0.5px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333)">';
  h+='<option value="subjective">주관점수</option><option value="numeric">수치입력</option><option value="hq_directive">본사지침</option></select>';
  h+='<button onclick="rAddItem()" style="padding:5px 12px;border-radius:5px;background:#1D9E75;color:#fff;border:none;font-size:12px;cursor:pointer">+ 추가</button>';
  h+='</div></div>';

  // 이슈 패널
  h+='<div style="font-size:11px;font-weight:500;color:#aaa;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">이슈 현황</div>';
  h+='<div id="issPanel" style="background:var(--bg,#fff);border-radius:12px;border:0.5px solid #ddd;padding:12px 14px;margin-bottom:12px">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
  h+='<span style="font-size:12px;font-weight:500;color:#888">진행 중인 이슈</span>';
  h+='<button onclick="sh('issFrm')" style="font-size:11px;padding:2px 8px;border-radius:4px;background:none;border:0.5px solid #ddd;cursor:pointer;color:#888">+ 새 이슈</button>';
  h+='</div>';
  h+='<div id="issFrm" style="display:none;background:#f8f8f6;border-radius:8px;padding:12px;margin-bottom:10px">';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">';
  h+='<input id="issT" placeholder="이슈 제목" style="padding:6px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">';
  h+='<select id="issPt" style="padding:6px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">';
  h+='<option value="kitchen">주방</option><option value="hall">홀</option><option value="service">서비스</option><option value="common">공통</option></select>';
  h+='<select id="issPr" style="padding:6px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">';
  h+='<option value="high">긴급</option><option value="medium" selected>보통</option><option value="low">낮음</option></select>';
  h+='<input id="issAs" placeholder="담당자" style="padding:6px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">';
  h+='</div>';
  h+='<textarea id="issDes" rows="2" placeholder="상세 내용" style="width:100%;padding:6px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333);resize:vertical;margin-bottom:8px;box-sizing:border-box"></textarea>';
  h+='<div style="display:flex;gap:8px">';
  h+='<button onclick="issSub()" style="padding:6px 16px;border-radius:5px;background:#D85A30;color:#fff;border:none;font-size:13px;cursor:pointer">등록</button>';
  h+='<button onclick="hd('issFrm')" style="padding:6px 12px;border-radius:5px;background:none;border:0.5px solid #ddd;font-size:13px;cursor:pointer;color:var(--text,#333)">취소</button>';
  h+='</div></div>';
  h+='<div id="issLst"></div></div>';

  // 이슈 의견 모달
  h+='<div id="issMdl" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,.45);z-index:999;align-items:flex-start;justify-content:center;padding-top:60px;min-height:400px">';
  h+='<div style="background:var(--bg,#fff);border-radius:12px;padding:20px;width:min(500px,90%)">';
  h+='<div id="issMdlT" style="font-weight:500;margin-bottom:12px;font-size:14px">이슈 코멘트</div>';
  h+='<div id="issMdlC" style="display:grid;gap:8px;margin-bottom:12px"></div>';
  h+='<div style="display:flex;gap:8px">';
  h+='<input id="issCmtA" placeholder="작성자" style="width:80px;padding:6px 8px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">';
  h+='<input id="issCmtT" placeholder="의견 입력..." style="flex:1;padding:6px 8px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">';
  h+='<button onclick="issCmtSub()" style="padding:6px 12px;border-radius:5px;background:#1D9E75;color:#fff;border:none;font-size:13px;cursor:pointer">등록</button>';
  h+='<button onclick="hd('issMdl')" style="padding:6px 10px;border-radius:5px;background:none;border:0.5px solid #ddd;font-size:13px;cursor:pointer;color:var(--text,#333)">닫기</button>';
  h+='</div></div></div>';

  // 담당자 총평
  h+='<div style="font-size:11px;font-weight:500;color:#aaa;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">담당자별 주간 총평</div>';
  h+='<div style="background:var(--bg,#fff);border-radius:12px;border:0.5px solid #ddd;overflow:hidden">';
  h+='<div style="padding:12px 16px;border-bottom:0.5px solid #eee;display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
  h+='<span style="font-size:13px;font-weight:500;flex:1">주간 총평</span>';
  h+='<select id="personSel" onchange="rPerson(parseInt(this.value))" style="padding:6px 12px;border-radius:6px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">';
  PS.forEach(function(p,i){ h+='<option value="'+i+'">'+p.av+' '+p.name+'</option>'; });
  h+='</select>';
  h+='<span id="cmtWkTag" style="font-size:11px;color:#aaa">'+l.t+' 기록</span>';
  h+='</div>';
  h+='<div style="padding:14px 16px">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">';
  h+='<div id="pAv" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;flex-shrink:0;background:#E1F5EE;color:#085041">셰</div>';
  h+='<div><div id="pNm" style="font-size:14px;font-weight:500">쉐프</div>';
  h+='<div id="pRl" style="font-size:11px;color:#888">주방 총괄</div></div></div>';
  h+='<div id="cmtSaved" style="display:none">';
  h+='<div id="cmtMeta" style="font-size:11px;color:#aaa;margin-bottom:6px"></div>';
  h+='<div id="cmtText" style="padding:12px 14px;background:#f5f5f3;border-radius:8px;font-size:13px;line-height:1.7;border-left:3px solid #1D9E75;margin-bottom:8px"></div>';
  h+='<button onclick="rEditCmt()" style="font-size:12px;padding:4px 12px;border-radius:5px;background:none;border:0.5px solid #ddd;cursor:pointer;color:#888">수정하기</button>';
  h+='</div>';
  h+='<div id="cmtInput">';
  h+='<textarea id="cmtTa" rows="4" placeholder="이번 주 소견을 입력하세요..." style="width:100%;padding:10px 12px;border-radius:8px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333);resize:none;line-height:1.6;margin-bottom:8px;box-sizing:border-box"></textarea>';
  h+='<div style="display:flex;align-items:center;justify-content:space-between">';
  h+='<span id="cmtChar" style="font-size:11px;color:#aaa">0자</span>';
  h+='<button onclick="rSaveCmt()" style="padding:7px 18px;border-radius:6px;background:#534AB7;color:#fff;border:none;font-size:12px;font-weight:500;cursor:pointer">저장</button>';
  h+='</div></div>';
  h+='<div style="margin-top:12px;padding-top:12px;border-top:0.5px solid #eee">';
  h+='<div style="font-size:11px;color:#aaa;margin-bottom:8px">다른 담당자 이번 주 총평</div>';
  h+='<div id="othersLst"></div>';
  h+='</div></div></div>';
  h+='<div id="rMsg" style="margin-top:10px;font-size:13px;min-height:20px;text-align:center"></div>';
  h+='</div>';

  panel.innerHTML=h;

  var ta=g('cmtTa');
  if(ta) ta.addEventListener('input',function(){st('cmtChar',this.value.length+'자');});

  updWk();
  rLoadItems('k');
  issLoad();
  rPerson(0);
}

window.rW=function(d){wOff+=d;updWk();rLoadItems(curPart);issLoad();rPerson(curPerson);};

function updWk(){
  var l=wlabel(wOff);
  st('rWt',l.t);st('rWs',l.s);st('cmtWkTag',l.t+' 기록');
}

window.rPart=function(pt){
  curPart=pt;
  var colors={k:'#0F6E56',h:'#185FA5',s:'#993C1D'};
  ['k','h','s'].forEach(function(x){
    var btn=g('ptab-'+x);
    var sc=g('sc-'+x);
    var isA=x===pt;
    if(btn){btn.style.borderBottomColor=isA?partColor[x]:'transparent';btn.style.color=isA?colors[x]:'#888';}
    if(sc) sc.style.border=isA?'2px solid '+partColor[x]:'0.5px solid #ddd';
  });
  st('rMemoLbl',partName[pt]+' 메모');
  var ar=g('rAddRow');if(ar)ar.style.display=editOn?'flex':'none';
  rLoadItems(pt);
};

window.rToggleEdit=function(){
  editOn=!editOn;
  var b=g('rEditBtn');
  if(b){b.textContent=editOn?'✅ 완료':'✏️ 편집';b.style.background=editOn?'#FAEEDA':'none';b.style.color=editOn?'#854F0B':'#888';}
  var ar=g('rAddRow');if(ar)ar.style.display=editOn?'flex':'none';
  document.querySelectorAll('.delBtn').forEach(function(b){b.style.display=editOn?'flex':'none';});
};

window.rLoadItems=function(pt){
  Promise.all([
    sbq('report_eval_items?part=eq.'+partMap[pt]+'&is_active=eq.true&order=sort_order'),
    sbq('report_weekly_scores?week_start=eq.'+monday(wOff))
  ]).then(function(res){
    var items=Array.isArray(res[0])?res[0]:[];
    var scores=Array.isArray(res[1])?res[1]:[];
    RC[pt]=items;
    var sm={};scores.forEach(function(s){sm[s.item_id]=s;});
    renderItems(pt,items,sm);
    updCard(pt,items,sm);
  });
};

function renderItems(pt,items,sm){
  var wrap=g('rItemsWrap');if(!wrap)return;
  if(!items.length){wrap.innerHTML='<p style="color:#888;padding:20px;text-align:center">항목 없음</p>';return;}
  var c=partColor[pt];
  var rows=items.map(function(it,idx){
    var s=sm[it.id]||{};
    var isN=it.type==='numeric',isH=it.type==='hq_directive';
    var cv=isN?(s.raw_value!=null?s.raw_value:''):(s.score!=null?s.score:0);
    var isOdd=idx%2===0;
    var bR=isOdd?'border-right:0.5px solid #eee;':'';
    var isLast=idx===items.length-1;
    var span=isLast&&items.length%2!==0?'grid-column:1/-1;border-right:none;':'';
    var bB=isLast&&items.length%2!==0?'':'border-bottom:0.5px solid #eee;';

    var inp='';
    if(isH){
      var o100=s.score===100?' selected':'';
      var o50=s.score===50?' selected':'';
      var o0=(s.score===0&&s.score!=null)?' selected':'';
      inp='<select data-id="'+it.id+'" class="rVal" style="padding:5px;border-radius:5px;border:0.5px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333)">';
      inp+='<option value="100"'+o100+'>완료(100)</option>';
      inp+='<option value="50"'+o50+'>부분완료(50)</option>';
      inp+='<option value="0"'+o0+'>미완료(0)</option>';
      inp+='</select>';
    } else if(isN){
      inp='<div style="display:flex;align-items:center;gap:4px">';
      inp+='<input type="number" data-id="'+it.id+'" class="rVal" value="'+(cv||'')+'" placeholder="입력" style="width:58px;padding:4px 6px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;text-align:center;background:var(--bg,#fff);color:var(--text,#333)">';
      inp+=(it.target_value!=null?'<span style="font-size:11px;color:#888">% (목표 '+it.target_value+'%)</span>':'');
      inp+='</div>';
    } else {
      var sColor=cv>=80?c:cv>=60?'#854F0B':'#A32D2D';
      inp='<div style="display:flex;flex-direction:column;align-items:center;gap:2px;min-width:64px">';
      inp+='<div id="sn-'+it.id+'" style="font-size:19px;font-weight:500;line-height:1;color:'+sColor+'">'+cv+'</div>';
      inp+='<input type="range" data-id="'+it.id+'" class="rVal" min="0" max="100" value="'+cv+'" style="width:58px;accent-color:'+c+'" oninput="rSlide(this)">';
      inp+='<div style="font-size:9px;color:#aaa">0-100점</div>';
      inp+='</div>';
    }

    var row='<div style="padding:10px 16px;display:flex;align-items:center;gap:10px;position:relative;'+bR+bB+span+'">';
    row+='<div style="font-size:12px;flex:1;line-height:1.4">'+it.title+'</div>';
    row+=inp;
    row+='<button class="delBtn" data-id="'+it.id+'" onclick="rDelItem(this)" style="display:'+(editOn?'flex':'none')+';position:absolute;right:6px;top:50%;transform:translateY(-50%);width:18px;height:18px;border-radius:50%;background:#FCEBEB;color:#A32D2D;border:none;cursor:pointer;font-size:11px;align-items:center;justify-content:center">x</button>';
    row+='</div>';
    return row;
  }).join('');
  wrap.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:0">'+rows+'</div>';
}

window.rSlide=function(inp){
  var id=inp.dataset.id,val=parseInt(inp.value);
  var n=g('sn-'+id);
  if(n){n.textContent=val;n.style.color=val>=80?partColor[curPart]:val>=60?'#854F0B':'#A32D2D';}
};

function updCard(pt,items,sm){
  var scores=[];
  items.forEach(function(it){
    if(it.type==='subjective'||it.type==='hq_directive'){var s=sm[it.id];if(s&&s.score!=null)scores.push(s.score);}
  });
  var avg=scores.length?Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length):null;
  st('scN-'+pt,avg!=null?String(avg):'-');
  var b=g('scB-'+pt);if(b)b.style.width=(avg||0)+'%';
  var nums=[];
  items.forEach(function(it){
    if(it.type==='numeric'){var s=sm[it.id];var v=s&&s.raw_value!=null?s.raw_value:'-';
      if(it.title.indexOf('식자재')>=0)nums.push('식재 '+v+'%');
      else if(it.title.indexOf('인건')>=0)nums.push('인건 '+v+'%');
      else if(it.title.indexOf('컴플')>=0)nums.push('컴플 '+v+'건');
      else if(it.title.indexOf('회전')>=0)nums.push('회전 '+v+'회');
    }
  });
  st('scS-'+pt,nums.join(' · ')||'');
}

window.rSaveAll=function(){
  var week=monday(wOff),rows=[];
  ['k','h','s'].forEach(function(pt){
    RC[pt].forEach(function(it){
      var inp=document.querySelector('.rVal[data-id="'+it.id+'"]');
      if(!inp)return;
      var rv=parseFloat(inp.value)||0,sc;
      if(it.type==='hq_directive')sc=parseInt(inp.value)||0;
      else if(it.type==='numeric'&&it.target_value)sc=Math.max(0,Math.min(100,Math.round((1-(rv-it.target_value)/it.target_value)*100)));
      else sc=Math.max(0,Math.min(100,rv));
      rows.push({item_id:it.id,week_start:week,raw_value:rv,score:sc,evaluator:'점장',memo:''});
    });
  });
  if(!rows.length){msg('입력된 항목이 없습니다','#854F0B');return;}
  fetch(SBU+'/rest/v1/report_weekly_scores',{method:'POST',headers:{'apikey':SBK,'Authorization':'Bearer '+SBK,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(rows)})
  .then(function(r){return r.json();}).then(function(d){
    msg(Array.isArray(d)?'저장 완료 ('+d.length+'개)':'오류: '+JSON.stringify(d).substring(0,50),Array.isArray(d)?'#1D9E75':'#A32D2D');
  });
};

window.rAddItem=function(){
  var name=(g('rNewName')||{}).value;if(!name||!name.trim())return;
  var type=(g('rNewType')||{}).value||'subjective';
  var maxS=RC[curPart].length?Math.max.apply(null,RC[curPart].map(function(i){return i.sort_order||0;})):0;
  sbq('report_eval_items',{method:'POST',body:JSON.stringify({part:partMap[curPart],type:type,title:name.trim(),is_active:true,sort_order:maxS+1})})
  .then(function(){if(g('rNewName'))g('rNewName').value='';rLoadItems(curPart);});
};

window.rDelItem=function(btn){
  var id=btn.dataset.id;
  if(!confirm('이 항목을 비활성화할까요?'))return;
  sbq('report_eval_items?id=eq.'+id,{method:'PATCH',headers:{'Prefer':'return=minimal'},body:JSON.stringify({is_active:false})})
  .then(function(){rLoadItems(curPart);});
};

window.rPerson=function(i){
  curPerson=i;var p=PS[i];
  var av=g('pAv');if(av){av.textContent=p.av;av.style.background=p.bg;av.style.color=p.co;}
  st('pNm',p.name);st('pRl',p.role);
  var week=monday(wOff);
  sbq('report_weekly_reports?week_start=eq.'+week).then(function(d){
    var row=Array.isArray(d)?d[0]:null;
    var saved=row&&row['comment_'+i]?row['comment_'+i]:(CMTS[i]||'');
    if(saved){CMTS[i]=saved;sh('cmtSaved');hd('cmtInput');st('cmtText',saved);st('cmtMeta',wlabel(wOff).t+' · 저장됨');}
    else{hd('cmtSaved');sh('cmtInput');var ta=g('cmtTa');if(ta)ta.value='';st('cmtChar','0자');}
    renderOthers(i);
  });
};

window.rEditCmt=function(){
  hd('cmtSaved');sh('cmtInput');
  var ta=g('cmtTa');if(ta){ta.value=CMTS[curPerson]||'';st('cmtChar',(CMTS[curPerson]||'').length+'자');}
};

window.rSaveCmt=function(){
  var ta=g('cmtTa');var text=ta?ta.value.trim():'';
  if(!text){alert('내용을 입력하세요');return;}
  CMTS[curPerson]=text;
  var week=monday(wOff),data={week_start:week};
  data['comment_'+curPerson]=text;
  fetch(SBU+'/rest/v1/report_weekly_reports',{method:'POST',headers:{'apikey':SBK,'Authorization':'Bearer '+SBK,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(data)})
  .then(function(){sh('cmtSaved');hd('cmtInput');st('cmtText',text);st('cmtMeta',wlabel(wOff).t+' · 방금 저장됨');renderOthers(curPerson);});
};

function renderOthers(skip){
  var list=g('othersLst');if(!list)return;
  list.innerHTML=PS.map(function(p,i){
    if(i===skip)return'';
    var t=CMTS[i];
    return '<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:0.5px solid #eee">'
      +'<div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;flex-shrink:0;background:'+p.bg+';color:'+p.co+';margin-top:1px">'+p.av+'</div>'
      +'<div><div style="font-size:11px;font-weight:500;color:#888;margin-bottom:2px">'+p.name+'</div>'
      +(t?'<div style="font-size:12px;line-height:1.5">'+t+'</div>':'<div style="font-size:12px;color:#aaa;font-style:italic">아직 작성하지 않았습니다</div>')
      +'</div></div>';
  }).filter(Boolean).join('');
}

var curIssId=null;
window.issLoad=function(){
  sbq('report_issues?order=created_at.desc&limit=20').then(function(iss){
    var list=g('issLst'),badge=g('rBadge');
    if(!list)return;
    if(!Array.isArray(iss)||!iss.length){list.innerHTML='<p style="text-align:center;padding:20px;color:#aaa;font-size:13px">등록된 이슈 없음</p>';if(badge)badge.style.display='none';return;}
    var open=iss.filter(function(i){return i.status!=='resolved';}).length;
    if(badge){badge.textContent='미해결 '+open+'건';badge.style.display=open?'inline':'none';}
    var SS={open:'background:#FCEBEB;color:#A32D2D',in_progress:'background:#FAEEDA;color:#854F0B',resolved:'background:#E1F5EE;color:#0F6E56'};
    var SL={open:'미해결',in_progress:'처리중',resolved:'완료'};
    var PL={kitchen:'주방',hall:'홀',service:'서비스',common:'공통'};
    var NS={open:'in_progress',in_progress:'resolved',resolved:'open'};
    var NL={open:'처리중으로',in_progress:'완료로',resolved:'재오픈'};
    var BC={high:'#D85A30',medium:'#EF9F27',low:'#1D9E75'};
    list.innerHTML=iss.map(function(iv){
      var id2=iv.id,st2=iv.title.replace(/['"]/g,'').substring(0,20);
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:0.5px solid #eee">'
        +'<div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:'+(BC[iv.priority]||'#ccc')+'"></div>'
        +'<div style="flex:1"><div style="font-size:13px">'+iv.title+'</div>'
        +'<div style="font-size:10px;color:#aaa;margin-top:2px">'+(PL[iv.part]||iv.part)+(iv.assignee?' · 담당:'+iv.assignee:'')+' · '+new Date(iv.created_at).toLocaleDateString('ko-KR')+'</div></div>'
        +'<span style="font-size:10px;padding:2px 6px;border-radius:8px;font-weight:500;flex-shrink:0;'+SS[iv.status]+'">'+SL[iv.status]+'</span>'
        +'<button onclick="issUpd(''+id2+'',''+NS[iv.status]+'')" style="padding:3px 8px;border-radius:5px;background:none;border:0.5px solid #ddd;font-size:11px;cursor:pointer;color:var(--text,#333)">'+NL[iv.status]+'</button>'
        +'<button onclick="issCmt(''+id2+'',''+st2+'')" style="padding:3px 8px;border-radius:5px;background:none;border:0.5px solid #ddd;font-size:11px;cursor:pointer;color:var(--text,#333)">의견</button>'
        +'</div>';
    }).join('');
  });
};

window.issSub=function(){
  var t=(g('issT')||{}).value;if(!t||!t.trim()){alert('제목을 입력하세요');return;}
  fetch(SBU+'/rest/v1/report_issues',{method:'POST',headers:{'apikey':SBK,'Authorization':'Bearer '+SBK,'Content-Type':'application/json','Prefer':'return=minimal'},
  body:JSON.stringify({title:t.trim(),part:(g('issPt')||{}).value,priority:(g('issPr')||{}).value,assignee:(g('issAs')||{}).value,description:(g('issDes')||{}).value})})
  .then(function(){hd('issFrm');['issT','issAs','issDes'].forEach(function(id){var e=g(id);if(e)e.value='';});issLoad();});
};

window.issUpd=function(id,status){
  fetch(SBU+'/rest/v1/report_issues?id=eq.'+id,{method:'PATCH',headers:{'apikey':SBK,'Authorization':'Bearer '+SBK,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({status:status,resolved_at:status==='resolved'?new Date().toISOString():null})}).then(function(){issLoad();});
};

window.issCmt=function(id,title){
  curIssId=id;st('issMdlT',title);sh('issMdl','flex');
  sbq('report_issue_comments?issue_id=eq.'+id+'&order=created_at.asc').then(function(cs){
    var w=g('issMdlC');
    if(!w)return;
    w.innerHTML=Array.isArray(cs)&&cs.length?cs.map(function(c){
      return '<div style="padding:8px;background:#f5f5f3;border-radius:6px"><div style="font-size:11px;color:#aaa;margin-bottom:3px">'+c.author+' · '+new Date(c.created_at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+'</div><div style="font-size:13px">'+c.content+'</div></div>';
    }).join(''):'<p style="color:#aaa;font-size:13px">의견 없음</p>';
  });
};

window.issCmtSub=function(){
  var a=(g('issCmtA')||{}).value||'익명',c=(g('issCmtT')||{}).value;if(!c||!c.trim())return;
  fetch(SBU+'/rest/v1/report_issue_comments',{method:'POST',headers:{'apikey':SBK,'Authorization':'Bearer '+SBK,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({issue_id:curIssId,author:a,content:c})})
  .then(function(){if(g('issCmtT'))g('issCmtT').value='';issCmt(curIssId,'');});
};

window.renderReportUI=buildUI;

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',buildUI);
}else{
  setTimeout(buildUI,200);
}
})();