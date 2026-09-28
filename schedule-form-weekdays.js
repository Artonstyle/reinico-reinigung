(function(){
  const weekdayStyle=document.createElement('style');
  weekdayStyle.textContent='.schedule-weekday-picker{grid-column:1/-1;padding:12px 14px;background:#f4f8fc;border:1px solid #d5e3f1;border-radius:10px}.schedule-weekday-picker>span{display:block;font-size:12px;font-weight:800;color:#51677e}.schedule-weekday-picker>small{display:block;margin:3px 0 9px;color:#71859a}.schedule-weekday-buttons{display:grid;grid-template-columns:repeat(7,1fr);gap:7px}.schedule-weekday-buttons button{min-height:38px;border:1px solid #c7d8ea;border-radius:8px;background:#fff;color:#285b8f;font-weight:800}.schedule-weekday-buttons button:hover{background:#e8f2fc}.schedule-weekday-buttons button.active{border-color:#1f65a8;background:#2169ad;color:#fff;box-shadow:0 3px 9px #17558f33}@media(max-width:600px){.schedule-weekday-buttons{gap:4px}.schedule-weekday-buttons button{min-height:34px;padding:4px;font-size:12px}}';
  document.head.append(weekdayStyle);
  const originalOpenScheduleForm=openScheduleForm,originalSubmit=form.onsubmit;
  const parseDate=value=>{const parts=String(value||'').split('-').map(Number);return parts.length===3&&parts.every(Number.isFinite)?new Date(parts[0],parts[1]-1,parts[2],12):null};
  openScheduleForm=function(date,row,employee){
    originalOpenScheduleForm(date,row,employee);
    const input=form.elements.datum;if(!input)return;
    const picker=document.createElement('div');picker.className='schedule-weekday-picker';picker.innerHTML=`<span>${row?'Wochentag':'Arbeitstage für den ganzen Monat auswählen'}</span><small>${row?'Dieser gespeicherte Einsatz wird einzeln bearbeitet.':'Alle markierten Wochentage werden mit denselben Angaben im ausgewählten Monat angelegt.'}</small><div class="schedule-weekday-buttons">${['Mo','Di','Mi','Do','Fr','Sa','So'].map((day,index)=>`<button type="button" data-weekday="${index}">${day}</button>`).join('')}</div>`;
    input.closest('label').parentElement.insertBefore(picker,input.closest('label'));
    const initial=parseDate(input.value),selected=new Set([initial?(initial.getDay()+6)%7:0]);
    const mark=()=>picker.querySelectorAll('button').forEach(button=>button.classList.toggle('active',selected.has(Number(button.dataset.weekday))));
    picker.onclick=event=>{const button=event.target.closest('[data-weekday]');if(!button||row)return;const day=Number(button.dataset.weekday);selected.has(day)?selected.delete(day):selected.add(day);mark()};
    input.addEventListener('change',()=>{const current=parseDate(input.value);selected.clear();if(current)selected.add((current.getDay()+6)%7);mark()});
    form._scheduleWeekdays=selected;form.dataset.scheduleBulk=row?'':'1';mark();
  };
  form.onsubmit=async function(event){
    if(form.dataset.kind!=='schedule'||form.dataset.id||form.dataset.scheduleBulk!=='1')return originalSubmit.call(this,event);
    event.preventDefault();const selected=form._scheduleWeekdays;if(!selected?.size)return alert('Bitte mindestens einen Wochentag markieren.');
    const data=Object.fromEntries(new FormData(form)),anchor=parseDate(data.datum);if(!anchor)return alert('Bitte ein gültiges Datum auswählen.');if(!String(data.mitarbeiter||'').trim())return alert('Bitte einen Mitarbeiter auswählen.');if(!data.beginn||!data.ende||data.ende<=data.beginn)return alert('Bitte gültige Arbeitszeiten eintragen.');
    const start=new Date(anchor.getFullYear(),anchor.getMonth(),1,12),end=new Date(anchor.getFullYear(),anchor.getMonth()+1,1,12),dates=[];for(let day=new Date(start);day<end;day.setDate(day.getDate()+1))if(selected.has((day.getDay()+6)%7))dates.push(new Date(day));
    const minutes=value=>{const [hour,minute]=value.split(':').map(Number);return hour*60+minute},button=form.querySelector('.primary');button.disabled=true;button.textContent='Monat wird gespeichert …';let saved=0,skipped=0;
    try{await refreshSheetKind('schedule');for(const day of dates){const iso=scheduleIso(day),conflict=db.schedule.some(item=>scheduleIso(scheduleDate(item.datum))===iso&&String(item.mitarbeiter||'').trim().toLowerCase()===data.mitarbeiter.trim().toLowerCase()&&(!item.beginn||!item.ende||(item.beginn<data.ende&&item.ende>data.beginn)));if(conflict){skipped++;continue}const payload={...data,target:'Schichtplan',id:'SCH-'+Date.now().toString().slice(-7)+'-'+String(day.getDate()).padStart(2,'0'),datum:deDate(iso),stunden:((minutes(data.ende)-minutes(data.beginn))/60).toFixed(2),erstelltam:new Date().toLocaleString('de-DE')};const result=await invoiceApi(payload);if(result.result!=='success'||result.responseWasNotJson)throw Error('Keine eindeutige Speicherbestätigung erhalten.');saved++}dlg.close();await refreshSheetKind('schedule');alert(`${saved} Schichten gespeichert.${skipped?` ${skipped} bereits belegte Tage wurden übersprungen.`:''}`)}catch(error){alert(`${saved} Schichten gespeichert. Danach abgebrochen: ${error.message}`)}finally{button.disabled=false;button.textContent='Speichern'}
  };
})();
