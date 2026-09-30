(()=>{
  const amount=item=>parseAmount(item.gesamt||item.betrag||0);
  const sets={
    newRequests:()=>db.customers.filter(item=>!item.status||/^neu$/i.test(item.status)),
    negotiating:()=>db.customers.filter(item=>/Verhandlung|Angebot gesendet/i.test(item.status||'')),
    tickets:()=>db.jobs.filter(item=>!/^erledigt$/i.test(item.status||'')),
    invoices:()=>db.invoices.filter(item=>!/bezahlt|storniert/i.test(item.status||'')),
    vacations:()=>db.schedule.filter(item=>/urlaub/i.test((item.ttigkeit||item.tätigkeit||item.taetigkeit||'')+' '+(item.status||''))&&!/genehmigt|abgelehnt|storniert/i.test(item.status||''))
  };
  const configs={
    'Neue Anfragen':{type:'newRequests',view:'customers',one:'Anfrage',many:'Anfragen'},
    'In Verhandlung':{type:'negotiating',view:'customers',one:'Vorgang',many:'Vorgänge'},
    'Offene Tickets':{type:'tickets',view:'jobs',one:'Ticket',many:'Tickets'},
    'Offene Rechnungen':{type:'invoices',view:'invoices',one:'Rechnung',many:'Rechnungen'},
    'Urlaubsanfragen':{type:'vacations',view:'attendance',one:'Antrag',many:'Anträge'}
  };
  const configFor=type=>Object.entries(configs).find(([,config])=>config.type===type);

  function decorateCards(){
    if(![...document.querySelectorAll('#stats .stat span')].some(item=>item.textContent.trim()==='Urlaubsanfragen')){
      const vacation=document.createElement('div');vacation.className='stat vacation-request-card';vacation.innerHTML='<span>Urlaubsanfragen</span><b>0</b>';document.getElementById('stats').append(vacation);
    }
    document.querySelectorAll('#stats .stat').forEach(card=>{
      const label=card.querySelector('span')?.textContent?.trim(),config=configs[label];
      if(!config)return;
      const rows=sets[config.type]();
      card.classList.add('dashboard-detail-link');
      card.dataset.dashboardDetail=config.type;
      card.tabIndex=0;
      card.setAttribute('role','button');
      card.setAttribute('aria-label',label+': Details anzeigen');
      card.title=label+' anzeigen';
      if(config.type==='invoices')card.querySelector('b').textContent=money(rows.reduce((sum,item)=>sum+amount(item),0));else if(config.type==='vacations')card.querySelector('b').textContent=String(new Set(rows.map(item=>String(item.id||item.schichtid||item.row_index))).size);
      let hint=card.querySelector('small');
      if(!hint){hint=document.createElement('small');card.append(hint)}
      hint.textContent=`${rows.length} ${rows.length===1?config.one:config.many} anzeigen ›`;
    });
  }

  const requestRow=item=>`<article><div class="dashboard-detail-main"><strong>${esc(item.name||item.absender||'Ohne Namen')}</strong><span>${esc(item.email||item.telefon||'Kein Kontakt eingetragen')}</span></div><div><small>Datum</small><b>${esc(item.datum||item.zeitstempel||'—')}</b></div><div><small>Dienstleistung</small><b>${esc(item.dienstleistung||'Nicht angegeben')}</b></div><div><small>Status</small>${badge(item.status||'Neu')}</div><div class="dashboard-detail-actions"><button class="primary" type="button" onclick="readItem('customers',${Number(item.row_index)})">Öffnen</button></div></article>`;
  const ticketRow=item=>`<article><div class="dashboard-detail-main"><strong>${esc(item.objekt||'Ohne Objekt')}</strong><span>${esc(item.problem||'Keine Beschreibung')}</span></div><div><small>Datum</small><b>${esc(item.datum||'—')}</b></div><div><small>Priorität</small><b>${esc(item.prioritt||item.priorität||'Normal')}</b></div><div><small>Status</small>${badge(item.status||'Offen')}</div><div class="dashboard-detail-actions"><button class="primary" type="button" onclick="openForm('jobs',${Number(item.row_index)})">Öffnen</button></div></article>`;
  const invoiceRow=item=>`<article><div class="dashboard-detail-main"><strong>${esc(item.rechnungsnr||'Ohne Rechnungsnummer')}</strong><span>${esc(item.kunde||'Kunde nicht eingetragen')}</span></div><div><small>Rechnungsdatum</small><b>${esc(item.datum||'—')}</b></div><div><small>Fällig am</small><b>${esc(item.flligam||item.faellig||'—')}</b></div><div><small>Status</small>${badge(item.status||'Offen')}</div><div class="dashboard-detail-amount"><small>Betrag</small><b>${money(amount(item))}</b></div><div class="dashboard-detail-actions"><button class="primary" type="button" onclick="showInvoiceSubtab('editor',${Number(item.row_index)})">Öffnen</button><button class="ghost" type="button" onclick="openStoredInvoicePdf(${Number(item.row_index)})">PDF</button></div></article>`;

  function renderPanel(type){
    document.getElementById('dashboardDetailPanel')?.remove();
    const [heading,config]=configFor(type)||[];
    if(!config)return;
    const rows=sets[type](),panel=document.createElement('section');
    panel.id='dashboardDetailPanel';
    panel.className='dashboard-detail-panel';
    const total=type==='invoices'?money(rows.reduce((sum,item)=>sum+amount(item),0)):`${rows.length} ${rows.length===1?config.one:config.many}`;
    const rowHtml=type==='tickets'?ticketRow:type==='invoices'?invoiceRow:requestRow;
    panel.innerHTML=`<header><div><small>DETAILANSICHT</small><h2>${heading}</h2></div><b>${total}</b></header>${rows.length?`<div class="dashboard-detail-list">${rows.map(rowHtml).join('')}</div>`:'<p class="empty">Derzeit gibt es hier keine offenen Einträge.</p>'}`;
    const host=type==='invoices'?document.getElementById('invoiceListPanel'):document.getElementById(config.view+'Table')?.parentElement||document.getElementById(config.view);
    host.prepend(panel);
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  window.openDashboardDetails=type=>{
    const entry=configFor(type);
    if(!entry)return;
    const config=entry[1];
    show(config.view);
    if(type==='vacations'){document.querySelector('[data-attendance-tab="requests"]')?.click();return}
    if(type==='invoices')showInvoiceSubtab('list');
    const search=document.querySelector(`#${config.view} .search`);
    if(search)search.value='';
    if(config.view==='customers')requestStatusFilter.value='';
    table(config.view);
    renderPanel(type);
  };
  const activate=event=>{const card=event.target.closest('.dashboard-detail-link');if(card)openDashboardDetails(card.dataset.dashboardDetail)};
  document.getElementById('stats')?.addEventListener('click',activate);
  document.getElementById('stats')?.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){const card=event.target.closest('.dashboard-detail-link');if(card){event.preventDefault();openDashboardDetails(card.dataset.dashboardDetail)}}});

  const renderBeforeDashboardLinks=render;
  render=function(){renderBeforeDashboardLinks();decorateCards()};
  decorateCards();

  const style=document.createElement('style');
  style.textContent=`.dashboard-detail-link{position:relative;cursor:pointer;transition:transform .15s,box-shadow .15s}.dashboard-detail-link:hover,.dashboard-detail-link:focus-visible{transform:translateY(-2px);box-shadow:0 9px 22px #174b8020;outline:2px solid #2d73b8;outline-offset:2px}.dashboard-detail-link small{display:block;margin-top:7px;color:#1d65a8;font-size:11px;font-weight:800}.dashboard-detail-panel{margin-bottom:16px;overflow:hidden;border:1px solid #bcd2e8;border-radius:13px;background:#fff;box-shadow:0 8px 24px #173b5f10}.dashboard-detail-panel>header{display:flex;align-items:center;justify-content:space-between;padding:17px 20px;background:#edf5fd;border-bottom:1px solid #c8d9eb}.dashboard-detail-panel h2{margin:2px 0 0;font-size:19px}.dashboard-detail-panel header small{color:#56718d;font-weight:900;letter-spacing:1px}.dashboard-detail-panel header>b{font-size:19px;color:#174f88}.dashboard-detail-list{display:grid}.dashboard-detail-list article{display:grid;grid-template-columns:minmax(180px,1.5fr) repeat(3,minmax(105px,.75fr)) auto auto;align-items:center;gap:15px;padding:14px 18px;border-bottom:1px solid #e0e8f1}.dashboard-detail-list article:last-child{border-bottom:0}.dashboard-detail-list article>div{display:grid;gap:3px}.dashboard-detail-list small{color:#708297;font-size:10px;text-transform:uppercase;font-weight:800}.dashboard-detail-main strong{color:#174f88;font-size:15px}.dashboard-detail-main span{color:#50667d}.dashboard-detail-amount b{font-size:17px}.dashboard-detail-actions{display:flex!important;grid-auto-flow:column;gap:6px!important}.dashboard-detail-actions button{padding:8px 10px}@media(max-width:900px){.dashboard-detail-list article{grid-template-columns:1fr 1fr}.dashboard-detail-main{grid-column:1/-1}.dashboard-detail-actions{grid-column:1/-1}.dashboard-detail-actions button{flex:1}.dashboard-detail-panel>header{align-items:flex-start;gap:10px}.dashboard-detail-panel header>b{font-size:16px}}`;
  style.textContent+=`#dashboard>.stats{grid-template-columns:repeat(5,minmax(0,1fr))}.vacation-request-card{background:#fff7e9!important}.vacation-request-card:before{background:#d2820b!important}@media(max-width:900px){#dashboard>.stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){#dashboard>.stats{grid-template-columns:1fr}}`;
  document.head.append(style);
})();
