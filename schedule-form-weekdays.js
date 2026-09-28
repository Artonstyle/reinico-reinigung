(function(){
  const weekdayStyle=document.createElement('style');
  weekdayStyle.textContent='.schedule-weekday-picker{grid-column:1/-1;padding:12px 14px;background:#f4f8fc;border:1px solid #d5e3f1;border-radius:10px}.schedule-weekday-picker>span{display:block;margin-bottom:8px;font-size:12px;font-weight:800;color:#51677e}.schedule-weekday-buttons{display:grid;grid-template-columns:repeat(7,1fr);gap:7px}.schedule-weekday-buttons button{min-height:38px;border:1px solid #c7d8ea;border-radius:8px;background:#fff;color:#285b8f;font-weight:800}.schedule-weekday-buttons button:hover{background:#e8f2fc}.schedule-weekday-buttons button.active{border-color:#1f65a8;background:#2169ad;color:#fff;box-shadow:0 3px 9px #17558f33}@media(max-width:600px){.schedule-weekday-buttons{gap:4px}.schedule-weekday-buttons button{min-height:34px;padding:4px;font-size:12px}}';
  document.head.append(weekdayStyle);
  const originalOpenScheduleForm=openScheduleForm;
  openScheduleForm=function(date,row,employee){
    originalOpenScheduleForm(date,row,employee);
    const dateInput=form.elements.datum;if(!dateInput)return;
    const picker=document.createElement('div');picker.className='schedule-weekday-picker';picker.innerHTML='<span>Wochentag auswählen</span><div class="schedule-weekday-buttons">'+['Mo','Di','Mi','Do','Fr','Sa','So'].map((day,index)=>`<button type="button" data-weekday="${index}">${day}</button>`).join('')+'</div>';
    const dateLabel=dateInput.closest('label');dateLabel.parentElement.insertBefore(picker,dateLabel);
    const parse=()=>{const value=dateInput.value,parts=value.split('-').map(Number);return parts.length===3&&parts.every(Number.isFinite)?new Date(parts[0],parts[1]-1,parts[2],12):null};
    const mark=()=>{const current=parse(),selected=current?(current.getDay()+6)%7:-1;picker.querySelectorAll('button').forEach(button=>button.classList.toggle('active',Number(button.dataset.weekday)===selected))};
    picker.onclick=event=>{const button=event.target.closest('[data-weekday]'),current=parse();if(!button||!current)return;const currentWeekday=(current.getDay()+6)%7;current.setDate(current.getDate()+Number(button.dataset.weekday)-currentWeekday);dateInput.value=scheduleIso(current);mark()};
    dateInput.addEventListener('change',mark);mark();
  };
})();
