(function(){
var U="https://hcdrqycgdcmwnqgahvqc.supabase.co",K="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZHJxeWNnZGNtd25xZ2FodnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNTc0NzMsImV4cCI6MjA4NzgzMzQ3M30._a88kW2GGWq4KFvcEnkWiu-Eo87wPBK2Y_im77gf0SE";
var PERSONS=[
  {name:"쉐프",role:"주방 총괄",av:"셰",bg:"#E1F5EE",co:"#085041"},
  {name:"점장",role:"홀 총괄",av:"점",bg:"#E6F1FB",co:"#0C447C"},
  {name:"진보과장",role:"운영 관리",av:"진",bg:"#FAEEDA",co:"#633806"},
  {name:"경신차장",role:"관리 지원",av:"경",bg:"#EEEDFE",co:"#3C3489"},
  {name:"현준선임",role:"서비스 관리",av:"현",bg:"#FAECE7",co:"#712B13"}
];

// ── Supabase fetch
function sbQ(path,opts){
  var h={"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"return=representation"};
  if(opts&&opts.headers)Object.keys(opts.headers).forEach(function(k){h[k]=opts.headers[k];});
  return fetch(U+"/rest/v1/"+path,Object.assign({},opts,{headers:h})).then(function(r){return r.json();});
}

// ── 주차 계산
function getMonday(off){
  var d=new Date(),day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);
  var mon=new Date(new Date(d).setDate(diff+(off||0)*7));
  return mon.toISOString().slice(0,10);
}
function weekLabel(off){
  var d=new Date(),day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);
  var mon=new Date(new Date(d).setDate(diff+(off||0)*7));
  var sun=new Date(mon);sun.setDate(mon.getDate()+6);
  var m=mon.getMonth()+1,wn=Math.ceil(mon.getDate()/7);
  var f=function(x){return (x.getMonth()+1)+"/"+String(x.getDate()).padStart(2,"0");};
  return {title:m+"월 "+wn+"주차",sub:f(mon)+" – "+f(sun),mon:mon.toISOString().slice(0,10)};
}

// ── 상태 전역
var wOff=0, curPart="k", curPerson=0, editOn=false;
var partScores={k:[],h:[],s:[]};
var comments=["","","","",""];
var savedComments=["","","","",""];
var RC={k:[],h:[],s:[]};

// ── HTML 렌더
function renderReportUI(){
  var panel=document.getElementById("tab-report");
  if(!panel)return;
  var lbl=weekLabel(wOff);
  panel.innerHTML=
    '<div style="padding:0 0 1.5rem;font-size:13px">'+
    // 헤더
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        '<button onclick="rptWeek(-1)" style="'+btnCircle()+'">&#8249;</button>'+
        '<div><div style="font-size:15px;font-weight:500" id="rpt-wt">'+lbl.title+'</div>'+
        '<div style="font-size:11px;color:#888" id="rpt-ws">'+lbl.sub+'</div></div>'+
        '<button onclick="rptWeek(1)" style="'+btnCircle()+'">&#8250;</button>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<span id="rpt-issue-badge" style="font-size:11px;padding:4px 10px;border-radius:20px;background:#FCEBEB;color:#A32D2D;font-weight:500"></span>'+
        '<button onclick="rptSaveAll()" style="padding:8px 20px;border-radius:8px;background:#1D9E75;color:#fff;border:none;font-size:13px;font-weight:500;cursor:pointer">전체 저장</button>'+
      '</div>'+
    '</div>'+
    // 점수 카드
    '<div style="font-size:11px;font-weight:500;color:#aaa;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">이번 주 점수</div>'+
    '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px">'+
      scoreCard("k","🍳 주방","#0F6E56","#1D9E75")+
      scoreCard("h","🪑 홀","#185FA5","#378ADD")+
      scoreCard("s","⭐ 서비스","#993C1D","#D85A30")+
    '</div>'+
    // 입력 패널
    '<div style="font-size:11px;font-weight:500;color:#aaa;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">항목별 평가 입력</div>'+
    '<div style="background:var(--bg,#fff);border-radius:12px;border:0.5px solid #ddd;overflow:hidden;margin-bottom:12px">'+
      '<div style="display:flex;border-bottom:0.5px solid #ddd;align-items:center">'+
        '<button onclick="rptPart('k')" id="ptab-k" style="'+ptabStyle("k",true)+'">🍳 주방</button>'+
        '<button onclick="rptPart('h')" id="ptab-h" style="'+ptabStyle("h",false)+'">🪑 홀</button>'+
        '<button onclick="rptPart('s')" id="ptab-s" style="'+ptabStyle("s",false)+'">⭐ 서비스</button>'+
        '<button onclick="rptToggleEdit()" id="edit-btn" style="margin-left:auto;margin-right:12px;padding:4px 10px;font-size:11px;border-radius:4px;background:none;border:0.5px solid #ddd;cursor:pointer;color:#888">✏️ 편집</button>'+
      '</div>'+
      '<div id="rpt-items-wrap"></div>'+
      '<div style="padding:8px 16px;border-top:0.5px solid #eee;display:flex;align-items:center;gap:8px">'+
        '<span style="font-size:11px;color:#aaa;flex-shrink:0" id="rpt-memo-label">주방 메모</span>'+
        '<input id="rpt-memo" placeholder="이번 주 특이사항..." style="flex:1;padding:5px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333)">'+
      '</div>'+
      '<div id="rpt-add-row" style="display:none;padding:8px 16px;border-top:0.5px solid #eee;align-items:center;gap:8px">'+
        '<input id="rpt-new-name" placeholder="새 항목명..." style="flex:1;padding:5px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333)">'+
        '<select id="rpt-new-type" style="padding:5px 8px;border-radius:5px;border:0.5px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333)">'+
          '<option value="subjective">주관점수</option><option value="numeric">수치입력</option><option value="hq_directive">본사지침</option>'+
        '</select>'+
        '<button onclick="rptAddItem()" style="padding:5px 12px;border-radius:5px;background:#1D9E75;color:#fff;border:none;font-size:12px;cursor:pointer">+ 추가</button>'+
      '</div>'+
    '</div>'+
    // 이슈
    '<div style="font-size:11px;font-weight:500;color:#aaa;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">이슈 현황</div>'+
    '<div style="background:var(--bg,#fff);border-radius:12px;border:0.5px solid #ddd;padding:12px 14px;margin-bottom:12px">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
        '<span style="font-size:12px;font-weight:500;color:#888">진행 중인 이슈</span>'+
        '<button onclick="issueShowForm()" style="font-size:11px;padding:2px 8px;border-radius:4px;background:none;border:0.5px solid #ddd;cursor:pointer;color:#888">+ 새 이슈</button>'+
      '</div>'+
      '<div id="iss-form" style="display:none;background:#f8f8f6;border-radius:8px;padding:12px;margin-bottom:10px">'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">'+
          '<input id="iss-title" placeholder="이슈 제목" style="padding:6px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">'+
          '<select id="iss-part" style="padding:6px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">'+
            '<option value="kitchen">주방</option><option value="hall">홀</option><option value="service">서비스</option><option value="common">공통</option>'+
          '</select>'+
          '<select id="iss-priority" style="padding:6px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">'+
            '<option value="high">긴급</option><option value="medium" selected>보통</option><option value="low">낮음</option>'+
          '</select>'+
          '<input id="iss-assignee" placeholder="담당자" style="padding:6px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">'+
        '</div>'+
        '<textarea id="iss-desc" rows="2" placeholder="상세 내용" style="width:100%;padding:6px 10px;border-radius:5px;border:0.5px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333);resize:vertical;margin-bottom:8px;box-sizing:border-box"></textarea>'+
        '<div style="display:flex;gap:8px">'+
          '<button onclick="issueSubmit()" style="padding:6px 16px;border-radius:5px;background:#D85A30;color:#fff;border:none;font-size:13px;cursor:pointer">등록</button>'+
          '<button onclick="document.getElementById('iss-form').style.display='none'" style="padding:6px 12px;border-radius:5px;background:none;border:0.5px solid #ddd;font-size:13px;cursor:pointer;color:var(--text,#333)">취소</button>'+
        '</div>'+
      '</div>'+
      '<div id="iss-list"></div>'+
    '</div>'+
    // 댓글 모달
    '<div id="iss-comment-modal" style="display:none;position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:999;align-items:center;justify-content:center;min-height:400px">'+
      '<div style="background:var(--bg,#fff);border-radius:12px;padding:20px;width:min(520px,90%);max-height:80vh;overflow-y:auto">'+
        '<div style="font-weight:500;margin-bottom:12px;font-size:14px" id="iss-modal-title">이슈 코멘트</div>'+
        '<div id="iss-modal-comments" style="display:grid;gap:8px;margin-bottom:12px"></div>'+
        '<div style="display:flex;gap:8px">'+
          '<input id="iss-comment-author" placeholder="작성자" style="width:90px;padding:6px 8px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">'+
          '<input id="iss-comment-text" placeholder="의견 입력..." style="flex:1;padding:6px 8px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">'+
          '<button onclick="issueCommentSubmit()" style="padding:6px 12px;border-radius:5px;background:#1D9E75;color:#fff;border:none;font-size:13px;cursor:pointer">등록</button>'+
          '<button onclick="document.getElementById('iss-comment-modal').style.display='none'" style="padding:6px 10px;border-radius:5px;background:none;border:0.5px solid #ddd;font-size:13px;cursor:pointer;color:var(--text,#333)">닫기</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    // 담당자 총평
    '<div style="font-size:11px;font-weight:500;color:#aaa;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">담당자별 주간 총평</div>'+
    '<div style="background:var(--bg,#fff);border-radius:12px;border:0.5px solid #ddd;overflow:hidden">'+
      '<div style="padding:12px 16px;border-bottom:0.5px solid #eee;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'+
        '<span style="font-size:13px;font-weight:500;flex:1">주간 총평</span>'+
        '<select id="person-sel" onchange="rptSwitchPerson(parseInt(this.value))" style="padding:6px 12px;border-radius:6px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">'+
          PERSONS.map(function(p,i){return '<option value="'+i+'">'+p.av+' '+p.name+'</option>';}).join("")+
        '</select>'+
        '<span id="cmt-week-tag" style="font-size:11px;color:#aaa"></span>'+
      '</div>'+
      '<div style="padding:14px 16px">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px" id="person-info-wrap">'+
          '<div id="person-av" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;flex-shrink:0;background:#E1F5EE;color:#085041">셰</div>'+
          '<div><div id="person-name" style="font-size:14px;font-weight:500">쉐프</div><div id="person-role" style="font-size:11px;color:#888">주방 총괄</div></div>'+
        '</div>'+
        '<div id="cmt-saved-view" style="display:none">'+
          '<div id="cmt-saved-meta" style="font-size:11px;color:#aaa;margin-bottom:6px"></div>'+
          '<div id="cmt-saved-text" style="padding:12px 14px;background:#f5f5f3;border-radius:8px;font-size:13px;line-height:1.7;border-left:3px solid #1D9E75;margin-bottom:8px"></div>'+
          '<button onclick="rptEditComment()" style="font-size:12px;padding:4px 12px;border-radius:5px;background:none;border:0.5px solid #ddd;cursor:pointer;color:#888">수정하기</button>'+
        '</div>'+
        '<div id="cmt-input-view">'+
          '<textarea id="cmt-ta" rows="4" placeholder="이번 주 소견을 입력하세요..." style="width:100%;padding:10px 12px;border-radius:8px;border:0.5px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333);resize:none;line-height:1.6;margin-bottom:8px;box-sizing:border-box"></textarea>'+
          '<div style="display:flex;align-items:center;justify-content:space-between">'+
            '<span id="cmt-char" style="font-size:11px;color:#aaa">0자</span>'+
            '<button onclick="rptSaveComment()" style="padding:7px 18px;border-radius:6px;background:#534AB7;color:#fff;border:none;font-size:12px;font-weight:500;cursor:pointer">저장</button>'+
          '</div>'+
        '</div>'+
        '<div id="others-wrap" style="margin-top:12px;padding-top:12px;border-top:0.5px solid #eee">'+
          '<div style="font-size:11px;color:#aaa;margin-bottom:8px">다른 담당자 이번 주 총평</div>'+
          '<div id="others-list"></div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div id="rpt-msg" style="margin-top:10px;font-size:13px;min-height:20px;text-align:center"></div>'+
    '</div>';

  // 이벤트: 슬라이더 & 총평 글자수
  document.getElementById("cmt-ta") && document.getElementById("cmt-ta").addEventListener("input",function(){
    document.getElementById("cmt-char").textContent=this.value.length+"자";
  });

  // 초기 렌더
  rptUpdateWeekLabel();
  rptLoadItems("k");
  issueLoad();
  rptSwitchPerson(0);
}

function btnCircle(){return "width:30px;height:30px;border-radius:50%;border:0.5px solid #ddd;background:var(--bg,#fff);cursor:pointer;font-size:15px;color:var(--text,#333);display:flex;align-items:center;justify-content:center";}
function ptabStyle(p,active){
  var colors={k:"#0F6E56",h:"#185FA5",s:"#993C1D"};
  var borders={k:"#1D9E75",h:"#378ADD",s:"#D85A30"};
  return "padding:10px 16px;font-size:13px;font-weight:500;cursor:pointer;border-bottom:"+(active?"2px solid "+borders[p]:"2px solid transparent")+";border-top:none;border-left:none;border-right:none;background:none;color:"+(active?colors[p]:"#888")+";margin-bottom:-0.5px";
}
function scoreCard(p,label,color,bar){
  return '<div onclick="rptPart(''+p+'')" id="sc-'+p+'" style="background:var(--bg,#fff);border-radius:12px;border:0.5px solid #ddd;padding:12px 14px;text-align:center;cursor:pointer">'+
    '<div style="font-size:11px;color:#888;margin-bottom:5px">'+label+'</div>'+
    '<div style="font-size:26px;font-weight:500;color:'+color+'" id="sc-num-'+p+'">—</div>'+
    '<div style="height:4px;background:#eee;border-radius:2px;margin:7px 0 4px;overflow:hidden"><div id="sc-bar-'+p+'" style="height:4px;border-radius:2px;background:'+bar+';width:0%;transition:width .3s"></div></div>'+
    '<div style="font-size:10px;color:#aaa" id="sc-sub-'+p+'"></div>'+
  '</div>';
}

// ── 주차 변경
window.rptWeek = function(d){
  wOff+=d;
  rptUpdateWeekLabel();
  rptLoadItems(curPart);
  issueLoad();
  rptSwitchPerson(curPerson);
};
function rptUpdateWeekLabel(){
  var l=weekLabel(wOff);
  var wt=document.getElementById("rpt-wt"),ws=document.getElementById("rpt-ws"),ct=document.getElementById("cmt-week-tag");
  if(wt)wt.textContent=l.title;
  if(ws)ws.textContent=l.sub;
  if(ct)ct.textContent=l.title+" 기록";
}

// ── 파트 탭 전환
window.rptPart = function(p){
  curPart=p;
  ["k","h","s"].forEach(function(x){
    var btn=document.getElementById("ptab-"+x);
    var isActive=x===p;
    if(btn) btn.style.cssText=ptabStyle(x,isActive);
    var sc=document.getElementById("sc-"+x);
    var borders={k:"#1D9E75",h:"#378ADD",s:"#D85A30"};
    if(sc) sc.style.border=isActive?"2px solid "+borders[x]:"0.5px solid #ddd";
  });
  var memoLabel=document.getElementById("rpt-memo-label");
  if(memoLabel) memoLabel.textContent={k:"주방",h:"홀",s:"서비스"}[p]+" 메모";
  var addRow=document.getElementById("rpt-add-row");
  if(addRow) addRow.style.display=editOn?"flex":"none";
  rptLoadItems(p);
};

// ── 편집 모드
window.rptToggleEdit = function(){
  editOn=!editOn;
  var btn=document.getElementById("edit-btn");
  if(btn){btn.textContent=editOn?"✅ 완료":"✏️ 편집";btn.style.background=editOn?"#FAEEDA":"none";btn.style.color=editOn?"#854F0B":"#888";}
  var addRow=document.getElementById("rpt-add-row");
  if(addRow) addRow.style.display=editOn?"flex":"none";
  document.querySelectorAll(".del-item-btn").forEach(function(b){b.style.display=editOn?"flex":"none";});
};

// ── 항목 로드 (Supabase)
window.rptLoadItems = function(part){
  var partMap={k:"kitchen",h:"hall",s:"service"};
  var week=getMonday(wOff);
  Promise.all([
    sbQ("report_eval_items?part=eq."+partMap[part]+"&is_active=eq.true&order=sort_order"),
    sbQ("report_weekly_scores?week_start=eq."+week)
  ]).then(function(res){
    var items=Array.isArray(res[0])?res[0]:[];
    var scores=Array.isArray(res[1])?res[1]:[];
    RC[part]=items;
    var sm={};scores.forEach(function(s){sm[s.item_id]=s;});
    renderItems(part,items,sm);
    updateScoreCard(part,items,sm);
  });
};

function renderItems(part,items,sm){
  var wrap=document.getElementById("rpt-items-wrap");
  if(!wrap)return;
  if(!items.length){wrap.innerHTML="<p style=color:#888;padding:20px>항목 없음</p>";return;}
  var colors={k:"#1D9E75",h:"#378ADD",s:"#D85A30"};
  var acc=colors[part];
  wrap.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:0">'+
    items.map(function(it,idx){
      var s=sm[it.id]||{};
      var isN=it.type==="numeric",isH=it.type==="hq_directive";
      var isOdd=idx%2===0;
      var borderR=isOdd?"border-right:0.5px solid #eee;":"";
      var curVal=isN?(s.raw_value!=null?s.raw_value:""):(s.score!=null?s.score:0);
      var colSpan=it.sort_order===items[items.length-1].sort_order&&items.length%2!==0?"grid-column:1/-1;border-right:none;":"";

      var inputHtml="";
      if(isH){
        var sv=s.score;
        var o100=sv===100?" selected":"",o50=sv===50?" selected":"",o0=(sv===0&&sv!=null)?" selected":"";
        inputHtml="<select data-id="+it.id+" class=rpt-val onchange=rptScoreChange(this) style=padding:5px;border-radius:5px;border:0.5px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333)>"+
          "<option value=100"+o100+">완료(100)</option><option value=50"+o50+">부분완료(50)</option><option value=0"+o0+">미완료(0)</option></select>";
      } else {
        inputHtml="<div style=display:flex;flex-direction:column;align-items:center;gap:2px;min-width:64px>"+
          "<div id=sn-"+it.id+" style=font-size:19px;font-weight:500;line-height:1;color:"+(curVal>=80?colors[part]:curVal>=60?"#854F0B":"#A32D2D")+">"+
            (isN?(curVal||"—"):curVal)+
          "</div>"+
          (isN
            ?"<div style=display:flex;align-items:center;gap:4px><input type=number data-id="+it.id+" class=rpt-val value="+(curVal||"")+" placeholder=입력 style=width:58px;padding:4px 6px;border-radius:5px;border:0.5px solid #ddd;font-size:13px;text-align:center;background:var(--bg,#fff);color:var(--text,#333)><span style=font-size:11px;color:#888>"+(it.target_value!=null?"%":"")+"</span></div>"
            :"<input type=range data-id="+it.id+" class=rpt-val min=0 max=100 value="+curVal+" oninput=rptSlide(this,'"+it.id+"','"+part+"') style=width:58px;accent-color:"+acc+">"
          )+
          "<div style=font-size:9px;color:#aaa>"+(isN?(it.target_value!=null?"목표 "+it.target_value+"%":"값 입력"):"0–100점")+"</div>"+
        "</div>";
      }
      return "<div style=padding:10px 16px;display:flex;align-items:center;gap:10px;border-bottom:0.5px solid #eee;position:relative;"+borderR+colSpan+">"+
        "<div style=font-size:12px;flex:1;line-height:1.4>"+it.title+
          (it.target_value!=null&&!isH?"<br><span style=font-size:10px;color:#aaa>목표 "+it.target_value+"%</span>":"")+
        "</div>"+
        inputHtml+
        "<button class=del-item-btn data-id="+it.id+" onclick=rptDelItem(this) style=display:"+(editOn?"flex":"none")+";position:absolute;right:6px;top:50%;transform:translateY(-50%);width:18px;height:18px;border-radius:50%;background:#FCEBEB;color:#A32D2D;border:none;cursor:pointer;font-size:11px;align-items:center;justify-content:center>&#215;</button>"+
      "</div>";
    }).join("")+
  "</div>";
}

function updateScoreCard(part,items,sm){
  var scores=[];
  items.forEach(function(it){
    if(it.type==="subjective"||it.type==="hq_directive"){
      var s=sm[it.id];
      if(s&&s.score!=null) scores.push(s.score);
    }
  });
  var avg=scores.length?Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length):null;
  var el=document.getElementById("sc-num-"+part);
  var bar=document.getElementById("sc-bar-"+part);
  var sub=document.getElementById("sc-sub-"+part);
  if(el) el.textContent=avg!=null?avg:"—";
  if(bar) bar.style.width=(avg||0)+"%";
  // 수치형 요약
  var numSummary=[];
  items.forEach(function(it){
    if(it.type==="numeric"){
      var s=sm[it.id];
      var v=s&&s.raw_value!=null?s.raw_value:"—";
      if(it.title.includes("식자재")) numSummary.push("식재 "+v+"%");
      else if(it.title.includes("인건")) numSummary.push("인건 "+v+"%");
      else if(it.title.includes("컴플")) numSummary.push("컴플 "+v+"건");
      else if(it.title.includes("회전")) numSummary.push("회전 "+v+"회");
    }
  });
  if(sub) sub.textContent=numSummary.join(" · ")||"";
}

window.rptSlide = function(el,id,part){
  var val=parseInt(el.value);
  var numEl=document.getElementById("sn-"+id);
  var colors={k:"#1D9E75",h:"#378ADD",s:"#D85A30"};
  if(numEl){numEl.textContent=val;numEl.style.color=val>=80?colors[part]:val>=60?"#854F0B":"#A32D2D";}
};

window.rptScoreChange = function(el){};

window.rptDelItem = function(btn){
  var id=btn.dataset.id;
  if(!confirm("이 항목을 비활성화할까요?"))return;
  sbQ("report_eval_items?id=eq."+id,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({is_active:false})})
  .then(function(){rptLoadItems(curPart);});
};

window.rptAddItem = function(){
  var name=(document.getElementById("rpt-new-name")||{}).value;
  if(!name||!name.trim())return;
  var type=(document.getElementById("rpt-new-type")||{}).value||"subjective";
  var partMap={k:"kitchen",h:"hall",s:"service"};
  var maxSort=RC[curPart].length?Math.max.apply(null,RC[curPart].map(function(i){return i.sort_order||0;})):0;
  sbQ("report_eval_items",{method:"POST",body:JSON.stringify({part:partMap[curPart],type:type,title:name.trim(),is_active:true,sort_order:maxSort+1})})
  .then(function(){document.getElementById("rpt-new-name").value="";rptLoadItems(curPart);});
};

// ── 전체 저장
window.rptSaveAll = function(){
  var week=getMonday(wOff);
  var partMap={k:"kitchen",h:"hall",s:"service"};
  var rows=[];
  ["k","h","s"].forEach(function(part){
    RC[part].forEach(function(it){
      var el=document.querySelector(".rpt-val[data-id='"+it.id+"']");
      if(!el)return;
      var rv=parseFloat(el.value)||0,sc;
      if(it.type==="hq_directive")sc=parseInt(el.value)||0;
      else if(it.type==="numeric"&&it.target_value)sc=Math.max(0,Math.min(100,Math.round((1-(rv-it.target_value)/it.target_value)*100)));
      else sc=Math.max(0,Math.min(100,rv));
      rows.push({item_id:it.id,week_start:week,raw_value:rv,score:sc,evaluator:"점장",memo:""});
    });
  });
  if(!rows.length){showMsg("입력된 항목이 없습니다","#854F0B");return;}
  fetch(U+"/rest/v1/report_weekly_scores",{method:"POST",headers:{"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(rows)})
  .then(function(r){return r.json();}).then(function(d){
    if(Array.isArray(d))showMsg("저장 완료 ("+d.length+"개 항목)","#1D9E75");
    else showMsg("오류: "+JSON.stringify(d).substring(0,60),"#A32D2D");
  });
};

function showMsg(txt,color){
  var m=document.getElementById("rpt-msg");
  if(m){m.textContent=txt;m.style.color=color;setTimeout(function(){m.textContent="";},3000);}
}

// ── 담당자 총평
var CI_cmts=["","","","",""];
window.rptSwitchPerson = function(idx){
  curPerson=idx;
  var p=PERSONS[idx];
  var av=document.getElementById("person-av"),nm=document.getElementById("person-name"),rl=document.getElementById("person-role");
  if(av){av.textContent=p.av;av.style.background=p.bg;av.style.color=p.co;}
  if(nm) nm.textContent=p.name;
  if(rl) rl.textContent=p.role;
  var week=getMonday(wOff);
  // Supabase에서 이번 주 해당 인원 총평 로드
  sbQ("report_weekly_reports?week_start=eq."+week).then(function(d){
    var row=Array.isArray(d)?d[0]:null;
    var key="comment_"+idx;
    var saved=row&&row[key]?row[key]:(CI_cmts[idx]||"");
    if(saved){
      var sv=document.getElementById("cmt-saved-view"),iv=document.getElementById("cmt-input-view");
      var st=document.getElementById("cmt-saved-text"),sm2=document.getElementById("cmt-saved-meta");
      if(sv)sv.style.display="block";if(iv)iv.style.display="none";
      if(st)st.textContent=saved;
      if(sm2)sm2.textContent=weekLabel(wOff).title+" · 저장됨";
    }else{
      var sv2=document.getElementById("cmt-saved-view"),iv2=document.getElementById("cmt-input-view");
      var ta=document.getElementById("cmt-ta"),cc=document.getElementById("cmt-char");
      if(sv2)sv2.style.display="none";if(iv2)iv2.style.display="block";
      if(ta)ta.value="";if(cc)cc.textContent="0자";
    }
    renderOthers(idx);
  });
};
window.rptEditComment=function(){
  var sv=document.getElementById("cmt-saved-view"),iv=document.getElementById("cmt-input-view");
  var ta=document.getElementById("cmt-ta"),cc=document.getElementById("cmt-char");
  if(sv)sv.style.display="none";if(iv)iv.style.display="block";
  if(ta){ta.value=CI_cmts[curPerson]||"";if(cc)cc.textContent=ta.value.length+"자";}
};
window.rptSaveComment=function(){
  var ta=document.getElementById("cmt-ta");
  var text=ta?ta.value.trim():"";
  if(!text){alert("내용을 입력하세요");return;}
  CI_cmts[curPerson]=text;
  var week=getMonday(wOff);
  var data={week_start:week};
  data["comment_"+curPerson]=text;
  fetch(U+"/rest/v1/report_weekly_reports",{method:"POST",headers:{"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(data)})
  .then(function(){
    var sv=document.getElementById("cmt-saved-view"),iv=document.getElementById("cmt-input-view");
    var st=document.getElementById("cmt-saved-text"),sm2=document.getElementById("cmt-saved-meta");
    if(sv)sv.style.display="block";if(iv)iv.style.display="none";
    if(st)st.textContent=text;
    if(sm2)sm2.textContent=weekLabel(wOff).title+" · 방금 저장됨";
    renderOthers(curPerson);
  });
};
function renderOthers(skip){
  var list=document.getElementById("others-list");
  if(!list)return;
  list.innerHTML=PERSONS.map(function(p,i){
    if(i===skip)return "";
    var txt=CI_cmts[i];
    return "<div style=display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:0.5px solid #eee>"+
      "<div style=width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;flex-shrink:0;background:"+p.bg+";color:"+p.co+";margin-top:1px>"+p.av+"</div>"+
      "<div><div style=font-size:11px;font-weight:500;color:#888;margin-bottom:2px>"+p.name+"</div>"+
      (txt?"<div style=font-size:12px;line-height:1.5>"+txt+"</div>":"<div style=font-size:12px;color:#aaa;font-style:italic>아직 작성하지 않았습니다</div>")+
      "</div></div>";
  }).filter(Boolean).join("").replace(/<div[^>]*>[sS]*?</div>s*$/, function(m){return m.replace('border-bottom:0.5px solid #eee','border-bottom:none');});
  list.innerHTML = list.innerHTML.replace(/border-bottom:0.5px solid #eee(</div></div></div>)$/, 'border-bottom:none$1');
}

// ── 이슈 (기존 유지 + 업데이트)
var CUI=null;
window.issueShowForm=function(){var f=document.getElementById("iss-form");if(f)f.style.display="block";};
window.issueLoad=function(){
  var q="report_issues?order=created_at.desc&limit=20";
  sbQ(q).then(function(issues){
    var list=document.getElementById("iss-list");
    var badge=document.getElementById("rpt-issue-badge");
    if(!list)return;
    if(!Array.isArray(issues)||!issues.length){
      list.innerHTML="<p style=text-align:center;padding:20px;color:#aaa;font-size:13px>등록된 이슈 없음</p>";
      if(badge)badge.style.display="none";return;
    }
    var open=issues.filter(function(i){return i.status==="open"||i.status==="in_progress";}).length;
    if(badge){badge.textContent="미해결 "+open+"건";badge.style.display=open?"inline":"none";}
    var SS={open:"background:#FCEBEB;color:#A32D2D",in_progress:"background:#FAEEDA;color:#854F0B",resolved:"background:#E1F5EE;color:#0F6E56"};
    var SL={open:"미해결",in_progress:"처리중",resolved:"완료"};
    var PL={kitchen:"주방",hall:"홀",service:"서비스",common:"공통"};
    var NS={open:"in_progress",in_progress:"resolved",resolved:"open"};
    var NL={open:"→처리중",in_progress:"→완료",resolved:"→재오픈"};
    var BC={high:"#D85A30",medium:"#EF9F27",low:"#1D9E75"};
    list.innerHTML=issues.map(function(iss){
      var st=iss.title.replace(/'/g,"").substring(0,25);
      var id2=iss.id;
      return "<div style=display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:0.5px solid #eee>"+
        "<div style=width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:5px;background:"+(BC[iss.priority]||"#ccc")+"></div>"+
        "<div style=flex:1><div style=font-size:13px;line-height:1.3>"+iss.title+"</div>"+
        "<div style=font-size:10px;color:#aaa;margin-top:2px>"+(PL[iss.part]||iss.part)+(iss.assignee?" · 담당:"+iss.assignee:"")+" · "+new Date(iss.created_at).toLocaleDateString("ko-KR")+"</div></div>"+
        "<span style=font-size:10px;padding:2px 6px;border-radius:8px;font-weight:500;flex-shrink:0;"+SS[iss.status]+">"+SL[iss.status]+"</span>"+
        "<button onclick=issueUpdateStatus('"+id2+"','"+NS[iss.status]+"') style=padding:3px 8px;border-radius:5px;background:none;border:0.5px solid #ddd;font-size:11px;cursor:pointer;color:var(--text,#333)>"+NL[iss.status]+"</button>"+
        "<button onclick=issueOpenComments('"+id2+"','"+st+"') style=padding:3px 8px;border-radius:5px;background:none;border:0.5px solid #ddd;font-size:11px;cursor:pointer;color:var(--text,#333)>의견</button>"+
      "</div>";
    }).join("");
  });
};
window.issueSubmit=function(){
  var title=(document.getElementById("iss-title")||{}).value;
  if(!title||!title.trim()){alert("제목을 입력하세요");return;}
  fetch(U+"/rest/v1/report_issues",{method:"POST",headers:{"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({title:title.trim(),part:(document.getElementById("iss-part")||{}).value,priority:(document.getElementById("iss-priority")||{}).value,assignee:(document.getElementById("iss-assignee")||{}).value,description:(document.getElementById("iss-desc")||{}).value})})
  .then(function(){
    document.getElementById("iss-form").style.display="none";
    ["iss-title","iss-assignee","iss-desc"].forEach(function(id){var e=document.getElementById(id);if(e)e.value="";});
    issueLoad();
  });
};
window.issueUpdateStatus=function(id,status){
  fetch(U+"/rest/v1/report_issues?id=eq."+id,{method:"PATCH",headers:{"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({status:status,resolved_at:status==="resolved"?new Date().toISOString():null})}).then(function(){issueLoad();});
};
var CI_iss=null;
window.issueOpenComments=function(issueId,title){
  CI_iss=issueId;
  document.getElementById("iss-modal-title").textContent=title;
  var modal=document.getElementById("iss-comment-modal");
  if(modal)modal.style.display="flex";
  sbQ("report_issue_comments?issue_id=eq."+issueId+"&order=created_at.asc").then(function(cs){
    var w=document.getElementById("iss-modal-comments");
    if(!w)return;
    w.innerHTML=Array.isArray(cs)&&cs.length?cs.map(function(c){
      return "<div style=padding:8px;background:#f5f5f3;border-radius:6px>"+
        "<div style=font-size:11px;color:#aaa;margin-bottom:3px>"+c.author+" · "+new Date(c.created_at).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})+"</div>"+
        "<div style=font-size:13px>"+c.content+"</div></div>";
    }).join(""):"<p style=color:#aaa;font-size:13px>의견 없음</p>";
  });
};
window.issueCommentSubmit=function(){
  var author=(document.getElementById("iss-comment-author")||{}).value||"익명";
  var content=(document.getElementById("iss-comment-text")||{}).value;
  if(!content||!content.trim())return;
  fetch(U+"/rest/v1/report_issue_comments",{method:"POST",headers:{"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({issue_id:CI_iss,author:author,content:content})})
  .then(function(){document.getElementById("iss-comment-text").value="";issueOpenComments(CI_iss,"");});
};

// ── showExecTab 확장 유지
var _orig=window.showExecTab;
window.showExecTab=function(t,b){
  if(_orig)_orig(t,b);
};

// ── 초기화
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",renderReportUI);
}else{
  setTimeout(renderReportUI,200);
}

})();