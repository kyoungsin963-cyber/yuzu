
(function(){
const SB = 'https://hcdrqycgdcmwnqgahvqc.supabase.co';
const SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZHJxeWNnZGNtd25xZ2FodnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY3NzcwNTksImV4cCI6MjAyMjM1MzA1OX0.J2a3TkDPJDpEAGmNxGmqpF5d-YHJKl5vMD7oOI0kxPo';

function sbQ(path, opts){
  opts = opts || {};
  return fetch(SB+'/rest/v1/'+path, Object.assign({headers:{'apikey':SKEY,'Authorization':'Bearer '+SKEY,'Content-Type':'application/json','Prefer':'return=representation'}}, opts)).then(function(r){return r.json();});
}

function getMonday(d){
  d = d || new Date();
  var day = d.getDay(), diff = d.getDate() - day + (day===0?-6:1);
  return new Date(new Date(d).setDate(diff)).toISOString().slice(0,10);
}

document.addEventListener('DOMContentLoaded', function(){
  var wd = document.getElementById('rpt-week');
  if(wd) wd.value = getMonday();
});

var rptCache = [];

window.rptLoad = function(){
  var part = document.getElementById('rpt-part').value;
  var week = document.getElementById('rpt-week').value;
  if(!week){alert('주간 시작일을 선택하세요'); return;}
  var typeLabel = {subjective:'주관점수', numeric:'수치', hq_directive:'본사지침'};
  Promise.all([
    sbQ('report_eval_items?part=eq.'+part+'&is_active=eq.true&order=sort_order'),
    sbQ('report_weekly_scores?week_start=eq.'+week)
  ]).then(function(results){
    var items = results[0], scores = results[1];
    rptCache = items;
    var scoreMap = {};
    (scores||[]).forEach(function(s){ scoreMap[s.item_id] = s; });
    var wrap = document.getElementById('rpt-items-wrap');
    if(!Array.isArray(items)||!items.length){wrap.innerHTML='<p style="color:#888;font-size:13px">항목이 없습니다</p>';return;}
    wrap.innerHTML = items.map(function(it){
      var s = scoreMap[it.id]||{};
      var isHq = it.type==='hq_directive', isNum = it.type==='numeric';
      var selOpts = ['<option value="100"'+(s.score===100?' selected':'')+'>완료 (100점)</option>',
        '<option value="50"'+(s.score===50?' selected':'')+'>부분완료 (50점)</option>',
        '<option value="0"'+(s.score===0&&s.score!==undefined?' selected':'')+'>미완료 (0점)</option>'].join('');
      return '<div style="background:var(--bg2,#f8f8f6);border-radius:8px;padding:12px;margin-bottom:2px">' +
        '<div style="font-size:13px;font-weight:500;margin-bottom:6px;color:var(--text,#333)">'+it.title+'</div>' +
        '<div style="font-size:11px;color:#888;margin-bottom:6px">'+typeLabel[it.type]+(it.target_value!=null?' · 목표: '+it.target_value:' ')+'</div>' +
        (isHq
          ? '<select data-id="'+it.id+'" class="rpt-val" style="padding:5px 8px;border-radius:5px;border:1px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333)">'+selOpts+'</select>'
          : '<input type="number" data-id="'+it.id+'" class="rpt-val" min="0" max="'+(isNum?9999:100)+'" value="'+(isNum?(s.raw_value||''):(s.score||0))+'" placeholder="'+(isNum?'실제값':'0-100점')+'" style="width:80px;padding:5px 8px;border-radius:5px;border:1px solid #ddd;font-size:13px;background:var(--bg,#fff);color:var(--text,#333)">') +
        '<input type="text" data-id="'+it.id+'" class="rpt-memo" placeholder="메모(선택)" value="'+(s.memo||'')+'" style="margin-left:8px;padding:5px 8px;border-radius:5px;border:1px solid #ddd;font-size:12px;background:var(--bg,#fff);color:var(--text,#333);width:calc(100% - 110px)">' +
        '</div>';
    }).join('');
  });
};

window.rptSave = function(){
  var week = document.getElementById('rpt-week').value;
  if(!rptCache.length){alert('먼저 불러오기를 클릭하세요'); return;}
  var rows = rptCache.map(function(it){
    var valEl = document.querySelector('.rpt-val[data-id="'+it.id+'"]');
    var memoEl = document.querySelector('.rpt-memo[data-id="'+it.id+'"]');
    var rawVal = parseFloat(valEl ? valEl.value : 0)||0;
    var score;
    if(it.type==='hq_directive') score = parseInt(valEl?valEl.value:0)||0;
    else if(it.type==='numeric' && it.target_value) score = Math.max(0,Math.min(100,Math.round((1-(rawVal-it.target_value)/it.target_value)*100)));
    else score = Math.max(0,Math.min(100,rawVal));
    return {item_id:it.id, week_start:week, raw_value:rawVal, score:score, evaluator:'점장', memo:memoEl?memoEl.value:''};
  });
  fetch(SB+'/rest/v1/report_weekly_scores', {
    method:'POST',
    headers:{'apikey':SKEY,'Authorization':'Bearer '+SKEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=representation'},
    body:JSON.stringify(rows)
  }).then(function(r){return r.json();}).then(function(d){
    var msg = document.getElementById('rpt-msg');
    msg.textContent = Array.isArray(d) ? '저장 완료 ('+d.length+'개)' : '오류: '+JSON.stringify(d).substring(0,50);
    setTimeout(function(){msg.textContent='';},3000);
  });
};

window.rptSaveComment = function(){
  var week = document.getElementById('rpt-week').value;
  var comment = document.getElementById('rpt-sin-comment').value;
  fetch(SB+'/rest/v1/report_weekly_reports', {
    method:'POST',
    headers:{'apikey':SKEY,'Authorization':'Bearer '+SKEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify({week_start:week, sin_comment:comment})
  }).then(function(){
    var msg = document.getElementById('rpt-msg');
    msg.textContent = '총평 저장 완료';
    setTimeout(function(){msg.textContent='';},3000);
  });
};

// ── 이슈 ──
var currentIssueId = null;

window.issueShowForm = function(){ document.getElementById('iss-form').style.display='block'; };

window.issueLoad = function(){
  var q = 'report_issues?order=created_at.desc';
  var p = (document.getElementById('iss-filter-part')||{}).value;
  var s = (document.getElementById('iss-filter-status')||{}).value;
  if(p) q += '&part=eq.'+p;
  if(s) q += '&status=eq.'+s;
  sbQ(q).then(function(issues){
    var statusStyle = {open:'background:#FCEBEB;color:#A32D2D', in_progress:'background:#FAEEDA;color:#854F0B', resolved:'background:#E1F5EE;color:#0F6E56'};
    var statusLabel = {open:'미해결', in_progress:'처리중', resolved:'완료'};
    var partLabel = {kitchen:'주방', hall:'홀', service:'서비스', common:'공통'};
    var nextStatus = {open:'in_progress', in_progress:'resolved', resolved:'open'};
    var nextLabel = {open:'처리중으로', in_progress:'완료로', resolved:'재오픈'};
    var list = document.getElementById('iss-list');
    if(!Array.isArray(issues)||!issues.length){list.innerHTML='<p style="text-align:center;padding:30px;color:#888;font-size:13px">등록된 이슈가 없습니다</p>';return;}
    list.innerHTML = issues.map(function(iss){
      var bcolor = iss.priority==='high'?'#D85A30':iss.priority==='medium'?'#EF9F27':'#1D9E75';
      return '<div style="background:var(--bg2,#f8f8f6);border-radius:8px;padding:12px;border-left:4px solid '+bcolor+'">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">' +
          '<span style="font-size:13px;font-weight:500;flex:1;color:var(--text,#333)">'+iss.title+'</span>' +
          '<span style="font-size:11px;padding:2px 8px;border-radius:10px;'+statusStyle[iss.status]+'">'+statusLabel[iss.status]+'</span>' +
          '<span style="font-size:11px;color:#888">'+partLabel[iss.part]+'</span>' +
        '</div>' +
        (iss.description?'<div style="font-size:12px;color:#888;margin-bottom:6px">'+iss.description+'</div>':'')+
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          (iss.assignee?'<span style="font-size:11px;color:#888">담당: '+iss.assignee+'</span>':'')+
          '<span style="font-size:11px;color:#888">'+new Date(iss.created_at).toLocaleDateString('ko-KR')+'</span>'+
          '<button onclick="issueUpdateStatus(''+iss.id+'',''+nextStatus[iss.status]+'')" style="padding:3px 8px;border-radius:5px;background:none;border:1px solid #ddd;font-size:11px;cursor:pointer;color:var(--text,#333)">→ '+nextLabel[iss.status]+'</button>'+
          '<button onclick="issueOpenComments(''+iss.id+'',''+iss.title.replace(/'/g,'').substring(0,20)+'')" style="padding:3px 8px;border-radius:5px;background:none;border:1px solid #ddd;font-size:11px;cursor:pointer;color:var(--text,#333)">의견보기</button>'+
        '</div>'+
      '</div>';
    }).join('');
  });
};

window.issueSubmit = function(){
  var title = document.getElementById('iss-title').value.trim();
  if(!title){alert('제목을 입력하세요'); return;}
  fetch(SB+'/rest/v1/report_issues',{
    method:'POST',
    headers:{'apikey':SKEY,'Authorization':'Bearer '+SKEY,'Content-Type':'application/json','Prefer':'return=minimal'},
    body:JSON.stringify({title:title, part:document.getElementById('iss-part').value, priority:document.getElementById('iss-priority').value, assignee:document.getElementById('iss-assignee').value, description:document.getElementById('iss-desc').value})
  }).then(function(){
    document.getElementById('iss-form').style.display='none';
    ['iss-title','iss-assignee','iss-desc'].forEach(function(id){document.getElementById(id).value='';});
    issueLoad();
  });
};

window.issueUpdateStatus = function(id, status){
  fetch(SB+'/rest/v1/report_issues?id=eq.'+id,{
    method:'PATCH',
    headers:{'apikey':SKEY,'Authorization':'Bearer '+SKEY,'Content-Type':'application/json','Prefer':'return=minimal'},
    body:JSON.stringify({status:status, resolved_at:status==='resolved'?new Date().toISOString():null})
  }).then(function(){ issueLoad(); });
};

window.issueOpenComments = function(issueId, title){
  currentIssueId = issueId;
  document.getElementById('iss-modal-title').textContent = title;
  var modal = document.getElementById('iss-comment-modal');
  modal.style.display = 'flex';
  sbQ('report_issue_comments?issue_id=eq.'+issueId+'&order=created_at.asc').then(function(comments){
    var wrap = document.getElementById('iss-modal-comments');
    wrap.innerHTML = Array.isArray(comments)&&comments.length ? comments.map(function(c){
      return '<div style="padding:8px 10px;background:var(--bg2,#f8f8f6);border-radius:6px">'+
        '<div style="font-size:11px;color:#888;margin-bottom:3px">'+c.author+' · '+new Date(c.created_at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+'</div>'+
        '<div style="font-size:13px;color:var(--text,#333)">'+c.content+'</div></div>';
    }).join('') : '<p style="color:#888;font-size:13px">아직 의견이 없습니다</p>';
  });
};

window.issueCommentSubmit = function(){
  var author = document.getElementById('iss-comment-author').value.trim()||'익명';
  var content = document.getElementById('iss-comment-text').value.trim();
  if(!content) return;
  fetch(SB+'/rest/v1/report_issue_comments',{
    method:'POST',
    headers:{'apikey':SKEY,'Authorization':'Bearer '+SKEY,'Content-Type':'application/json','Prefer':'return=minimal'},
    body:JSON.stringify({issue_id:currentIssueId, author:author, content:content})
  }).then(function(){
    document.getElementById('iss-comment-text').value='';
    issueOpenComments(currentIssueId, document.getElementById('iss-modal-title').textContent);
  });
};

// showExecTab 확장
var _orig = window.showExecTab;
window.showExecTab = function(tabId, btn){
  if(tabId==='report'||tabId==='issues'){
    document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
    document.querySelectorAll('#exec-tabs .tab-btn').forEach(function(b){b.classList.remove('active');});
    var panel = document.getElementById('tab-'+tabId);
    if(panel) panel.classList.add('active');
    if(btn) btn.classList.add('active');
    if(tabId==='issues') issueLoad();
  } else if(_orig){ _orig(tabId, btn); }
};

})();
