(function(){
var U="https://hcdrqycgdcmwnqgahvqc.supabase.co",K="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZHJxeWNnZGNtd25xZ2FodnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNTc0NzMsImV4cCI6MjA4NzgzMzQ3M30._a88kW2GGWq4KFvcEnkWiu-Eo87wPBK2Y_im77gf0SE";
function q(p,o){var h={"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"return=representation"};if(o&&o.headers)Object.keys(o.headers).forEach(function(k){h[k]=o.headers[k];});return fetch(U+"/rest/v1/"+p,Object.assign({},o,{headers:h})).then(function(r){return r.json();});}
function monday(){var d=new Date(),day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);return new Date(new Date(d).setDate(diff)).toISOString().slice(0,10);}
document.addEventListener("DOMContentLoaded",function(){var w=document.getElementById("rpt-week");if(w)w.value=monday();});
var RC=[];
window.rptLoad=function(){
var part=document.getElementById("rpt-part").value,week=document.getElementById("rpt-week").value;
if(!week){alert("주간 시작일을 선택하세요");return;}
var TL={subjective:"주관점수",numeric:"수치입력",hq_directive:"본사지침"};
Promise.all([q("report_eval_items?part=eq."+part+"&is_active=eq.true&order=sort_order"),q("report_weekly_scores?week_start=eq."+week)]).then(function(r){
var items=r[0],scores=r[1];RC=Array.isArray(items)?items:[];
var sm={};if(Array.isArray(scores))scores.forEach(function(s){sm[s.item_id]=s;});
var wrap=document.getElementById("rpt-items-wrap");
if(!RC.length){wrap.innerHTML="<p style='color:#888;padding:20px'>항목 없음</p>";return;}
wrap.innerHTML=RC.map(function(it){
var s=sm[it.id]||{},isN=it.type==="numeric",isH=it.type==="hq_directive";
var ti=it.target_value!=null?" (목표:"+it.target_value+")":"";
var inp=isH?"<select data-id='"+it.id+"' class='rv' style='padding:5px 8px;border-radius:5px;border:1px solid #ccc;font-size:12px'><option value='100'"+(s.score===100?" selected":"")+">완료(100)</option><option value='50'"+(s.score===50?" selected":"")+">부분완료(50)</option><option value='0'"+(s.score===0&&s.score!==undefined?" selected":"")+">미완료(0)</option></select>"
:"<input type='number' data-id='"+it.id+"' class='rv' min='0' max='"+(isN?9999:100)+"' value='"+(isN?(s.raw_value||""):(s.score!==undefined?s.score:0))+"' placeholder='"+(isN?"실제값":"0-100점")+"' style='width:80px;padding:5px 8px;border-radius:5px;border:1px solid #ccc;font-size:13px'>";
return "<div style='background:var(--bg2,#f5f5f3);border-radius:8px;padding:12px;margin-bottom:6px'><div style='font-size:13px;font-weight:500;margin-bottom:4px'>"+it.title+"</div><div style='font-size:11px;color:#888;margin-bottom:8px'>"+TL[it.type]+ti+"</div><div style='display:flex;align-items:center;gap:8px;flex-wrap:wrap'>"+inp+"<input type='text' data-id='"+it.id+"' class='rm' placeholder='메모(선택)' value='"+(s.memo||"")+"' style='flex:1;min-width:100px;padding:5px 8px;border-radius:5px;border:1px solid #ccc;font-size:12px'></div></div>";
}).join("");
}).catch(function(e){document.getElementById("rpt-items-wrap").innerHTML="<p style='color:#c00'>오류:"+e.message+"</p>";});
};
window.rptSave=function(){
var week=document.getElementById("rpt-week").value;
if(!week||!RC.length){alert("먼저 불러오기를 클릭하세요");return;}
var rows=RC.map(function(it){
var ve=document.querySelector(".rv[data-id='"+it.id+"']"),me=document.querySelector(".rm[data-id='"+it.id+"']");
var rv=parseFloat(ve?ve.value:0)||0,sc;
if(it.type==="hq_directive")sc=parseInt(ve?ve.value:0)||0;
else if(it.type==="numeric"&&it.target_value)sc=Math.max(0,Math.min(100,Math.round((1-(rv-it.target_value)/it.target_value)*100)));
else sc=Math.max(0,Math.min(100,rv));
return{item_id:it.id,week_start:week,raw_value:rv,score:sc,evaluator:"점장",memo:me?me.value:""};
});
fetch(U+"/rest/v1/report_weekly_scores",{method:"POST",headers:{"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(rows)})
.then(function(r){return r.json();}).then(function(d){var m=document.getElementById("rpt-msg");m.textContent=Array.isArray(d)?"저장완료("+d.length+"개)":"오류:"+JSON.stringify(d).substring(0,50);m.style.color=Array.isArray(d)?"#1D9E75":"#c00";setTimeout(function(){m.textContent="";},3000);});
};
window.rptSaveComment=function(){
var week=document.getElementById("rpt-week").value,cmt=document.getElementById("rpt-sin-comment").value;
if(!week)return;
fetch(U+"/rest/v1/report_weekly_reports",{method:"POST",headers:{"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({week_start:week,sin_comment:cmt})})
.then(function(){var m=document.getElementById("rpt-msg");m.textContent="총평저장완료";m.style.color="#1D9E75";setTimeout(function(){m.textContent="";},3000);});
};
var CI=null;
window.issueShowForm=function(){document.getElementById("iss-form").style.display="block";};
window.issueLoad=function(){
var qs="report_issues?order=created_at.desc";
var pEl=document.getElementById("iss-filter-part"),sEl=document.getElementById("iss-filter-status");
if(pEl&&pEl.value)qs+="&part=eq."+pEl.value;if(sEl&&sEl.value)qs+="&status=eq."+sEl.value;
q(qs).then(function(issues){
var list=document.getElementById("iss-list");
if(!Array.isArray(issues)||!issues.length){list.innerHTML="<p style='text-align:center;padding:30px;color:#888;font-size:13px'>등록된 이슈 없음</p>";return;}
var SS={open:"background:#FCEBEB;color:#A32D2D",in_progress:"background:#FAEEDA;color:#854F0B",resolved:"background:#E1F5EE;color:#0F6E56"};
var SL={open:"미해결",in_progress:"처리중",resolved:"완료"};
var PL={kitchen:"주방",hall:"홀",service:"서비스",common:"공통"};
var NS={open:"in_progress",in_progress:"resolved",resolved:"open"};
var NL={open:"처리중으로",in_progress:"완료로",resolved:"재오픈"};
var BC={high:"#D85A30",medium:"#EF9F27",low:"#1D9E75"};
list.innerHTML=issues.map(function(iss){
var st=iss.title.replace(/'/g,"").substring(0,25);
return "<div style='background:var(--bg2,#f5f5f3);border-radius:8px;padding:12px;border-left:4px solid "+(BC[iss.priority]||"#ccc")+";margin-bottom:4px'><div style='display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap'><span style='font-size:13px;font-weight:500;flex:1'>"+iss.title+"</span><span style='font-size:11px;padding:2px 8px;border-radius:10px;"+(SS[iss.status]||"")+"'>"+SL[iss.status]+"</span><span style='font-size:11px;color:#888'>"+(PL[iss.part]||iss.part)+"</span></div>"+(iss.description?"<div style='font-size:12px;color:#888;margin-bottom:6px'>"+iss.description+"</div>":"")+"<div style='display:flex;align-items:center;gap:8px;flex-wrap:wrap'>"+(iss.assignee?"<span style='font-size:11px;color:#888'>담당:"+iss.assignee+"</span>":"")+"<span style='font-size:11px;color:#888'>"+new Date(iss.created_at).toLocaleDateString("ko-KR")+"</span><button onclick='issueUpdateStatus(""+iss.id+"",""+NS[iss.status]+"")' style='padding:3px 9px;border-radius:5px;background:none;border:1px solid #ccc;font-size:11px;cursor:pointer'>→"+NL[iss.status]+"</button><button onclick='issueOpenComments(""+iss.id+"",""+st+"")' style='padding:3px 9px;border-radius:5px;background:none;border:1px solid #ccc;font-size:11px;cursor:pointer'>의견</button></div></div>";
}).join("");});
};
window.issueSubmit=function(){
var title=document.getElementById("iss-title").value.trim();if(!title){alert("제목을 입력하세요");return;}
fetch(U+"/rest/v1/report_issues",{method:"POST",headers:{"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({title:title,part:document.getElementById("iss-part").value,priority:document.getElementById("iss-priority").value,assignee:document.getElementById("iss-assignee").value,description:document.getElementById("iss-desc").value})})
.then(function(){document.getElementById("iss-form").style.display="none";["iss-title","iss-assignee","iss-desc"].forEach(function(id){document.getElementById(id).value="";});issueLoad();});
};
window.issueUpdateStatus=function(id,status){
var data={status:status};if(status==="resolved")data.resolved_at=new Date().toISOString();else data.resolved_at=null;
fetch(U+"/rest/v1/report_issues?id=eq."+id,{method:"PATCH",headers:{"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(data)}).then(function(){issueLoad();});
};
window.issueOpenComments=function(issueId,title){
CI=issueId;document.getElementById("iss-modal-title").textContent=title;document.getElementById("iss-comment-modal").style.display="flex";
q("report_issue_comments?issue_id=eq."+issueId+"&order=created_at.asc").then(function(cs){
var w=document.getElementById("iss-modal-comments");
if(!Array.isArray(cs)||!cs.length){w.innerHTML="<p style='color:#888;font-size:13px'>의견 없음</p>";return;}
w.innerHTML=cs.map(function(c){var dt=new Date(c.created_at).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});return "<div style='padding:8px 10px;background:var(--bg2,#f5f5f3);border-radius:6px;margin-bottom:4px'><div style='font-size:11px;color:#888;margin-bottom:3px'>"+c.author+" · "+dt+"</div><div style='font-size:13px'>"+c.content+"</div></div>";}).join("");});
};
window.issueCommentSubmit=function(){
var author=document.getElementById("iss-comment-author").value.trim()||"익명",content=document.getElementById("iss-comment-text").value.trim();if(!content)return;
fetch(U+"/rest/v1/report_issue_comments",{method:"POST",headers:{"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({issue_id:CI,author:author,content:content})}).then(function(){document.getElementById("iss-comment-text").value="";issueOpenComments(CI,document.getElementById("iss-modal-title").textContent);});
};
var _o=window.showExecTab;
window.showExecTab=function(t,b){
if(t==="report"||t==="issues"){document.querySelectorAll(".tab-panel").forEach(function(p){p.classList.remove("active");});document.querySelectorAll("#exec-tabs .tab-btn").forEach(function(b){b.classList.remove("active");});var panel=document.getElementById("tab-"+t);if(panel)panel.classList.add("active");if(b)b.classList.add("active");if(t==="issues")issueLoad();}else if(_o){_o(t,b);}
};
})();