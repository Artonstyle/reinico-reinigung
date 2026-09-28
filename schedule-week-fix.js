(function(){
  const previousRenderSchedule=renderSchedule;
  const cleanScheduleName=value=>String(value||'').trim().replace(/\s+/g,' ');
  const scheduleNameKey=value=>cleanScheduleName(value).toLocaleLowerCase('de-DE');
  const style=document.createElement('style');
  style.textContent='.planner-entry{position:relative;margin-bottom:6px}.planner-entry .planner-shift{margin-bottom:0;padding-right:34px}.planner-entry-delete{position:absolute;top:5px;right:5px;z-index:2;width:26px;height:26px;border:1px solid #efb8bd;border-radius:7px;background:#fff;color:#b4232f;font-size:15px;font-weight:800;line-height:1}.planner-entry-delete:hover{background:#fff0f1}';
  document.head.append(style);
  window.deleteScheduleEntry=async function(row,label){
    if(!Number(row))return alert('Dieser Eintrag hat keine gültige Zeilennummer. Bitte zuerst aktualisieren.');
    if(!confirm(`Schicht ${label||''} wirklich dauerhaft löschen?`))return;
    try{
      const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams({action:'delete_row',target:'Schichtplan',row_index:String(row)})});
      const result=await readApiResult(response);
      if(result.deleted!==true)throw Error('Löschen wurde vom Apps Script nicht bestätigt.');
      await refreshSheetKind('schedule');
    }catch(error){alert('Schicht konnte nicht gelöscht werden: '+error.message)}
  };
  renderSchedule=function(){
    if(scheduleMode!=='week')return previousRenderSchedule();
    const board=document.getElementById('scheduleBoard');if(!board)return;
    const weekButton=document.getElementById('scheduleWeekBtn'),monthButton=document.getElementById('scheduleMonthBtn'),range=document.getElementById('scheduleRange'),summary=document.getElementById('scheduleSummary');
    weekButton.classList.add('active');monthButton.classList.remove('active');
    const start=scheduleWeekStart(scheduleCursor),end=new Date(start),days=[];end.setDate(end.getDate()+7);
    for(let day=new Date(start);day<end;day.setDate(day.getDate()+1))days.push(new Date(day));
    range.textContent=`${start.toLocaleDateString('de-DE',{day:'2-digit',month:'short'})} – ${new Date(end-1).toLocaleDateString('de-DE',{day:'2-digit',month:'short',year:'numeric'})}`;
    const visible=db.schedule.filter(item=>{const date=scheduleDate(item.datum);return date&&date>=start&&date<end});
    const planned=visible.filter(item=>/Geplant|Bestätigt/i.test(item.status||'')).length,done=visible.filter(item=>/^Erledigt$/i.test(item.status||'')).length,hours=visible.reduce((sum,item)=>sum+(parseFloat(String(item.stunden||'').replace(',','.'))||0),0);
    summary.innerHTML=`<div><span>Einsätze</span><b>${visible.length}</b></div><div><span>Geplant</span><b>${planned}</b></div><div><span>Erledigt</span><b>${done}</b></div><div><span>Arbeitsstunden</span><b>${hours.toLocaleString('de-DE',{maximumFractionDigits:1})}</b></div>`;
    const people=new Map();
    db.staff.forEach(person=>{const name=cleanScheduleName(person.name);if(name)people.set(scheduleNameKey(name),name)});
    visible.forEach(item=>{const name=cleanScheduleName(item.mitarbeiter);if(name&&!people.has(scheduleNameKey(name)))people.set(scheduleNameKey(name),name)});
    if(visible.some(item=>!cleanScheduleName(item.mitarbeiter)))people.set('__unassigned__','Nicht zugewiesen');
    if(!people.size)people.set('__empty__','Noch kein Mitarbeiter');
    const heads='<div class="planner-head"><small>Team</small><b>Mitarbeiter</b></div>'+days.map(day=>{const iso=scheduleIso(day);return `<div class="planner-head ${iso===scheduleIso(new Date())?'today':''}"><small>${day.toLocaleDateString('de-DE',{weekday:'short'})}</small><b>${day.getDate()}</b></div>`}).join('');
    const rows=[...people].map(([key,name])=>{
      const matches=item=>key==='__unassigned__'?!cleanScheduleName(item.mitarbeiter):scheduleNameKey(item.mitarbeiter)===key,count=visible.filter(matches).length;
      const person=`<div class="planner-person"><span class="planner-avatar">${key==='__unassigned__'?'?':scheduleInitials(name)}</span><div><b>${esc(name)}</b><small>${count} ${count===1?'Eintrag':'Einträge'}</small></div></div>`;
      const cells=days.map(day=>{const iso=scheduleIso(day),items=visible.filter(item=>matches(item)&&scheduleIso(scheduleDate(item.datum))===iso).sort((a,b)=>String(a.beginn||'').localeCompare(String(b.beginn||''))),weekend=day.getDay()===0||day.getDay()===6,today=iso===scheduleIso(new Date());
        const content=items.map(item=>{const task=item.tätigkeit||item.ttigkeit||'',absence=/Krank|Urlaub|Frei/i.test((item.status||'')+' '+task),cls=/^Erledigt$/i.test(item.status||'')?'done':/^Ausgefallen$/i.test(item.status||'')?'cancelled':absence?'absence':'',label=`${item.datum||''} ${item.beginn||''}`.replace(/'/g,"\\'");return `<div class="planner-entry"><button class="planner-shift ${cls}" type="button" onclick="openScheduleForm(null,${Number(item.row_index)})"><span>${esc(item.beginn&&item.ende?item.beginn+'–'+item.ende:(item.status||'Ganztägig'))}</span><strong>${esc(task||item.objekt||'Einsatz')}</strong><small>${esc(item.objekt||item.status||'')}</small></button><button class="planner-entry-delete" type="button" onclick="deleteScheduleEntry(${Number(item.row_index)},'${label}')" title="Schicht löschen" aria-label="Schicht löschen">×</button></div>`}).join('');
        const employee=key.startsWith('__')?'':name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");return `<div class="planner-cell ${weekend?'weekend':''} ${today?'today':''}">${content||`<button class="planner-add" type="button" onclick="openScheduleForm(new Date('${iso}T12:00:00'),null,'${employee}')" title="Einsatz hinzufügen">＋</button>`}</div>`}).join('');
      return person+cells}).join('');
    board.className='planner-wrap';board.innerHTML=`<div class="planner-grid">${heads}${rows}</div>`;
  };
})();
