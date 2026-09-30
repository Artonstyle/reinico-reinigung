(()=>{
  const isOutstanding=item=>!/bezahlt|storniert/i.test(String(item.status||''));
  const outstanding=()=>Array.isArray(db.invoices)?db.invoices.filter(isOutstanding):[];
  const amount=item=>parseAmount(item.gesamt||item.betrag||0);

  function decorateDashboardInvoiceCard(){
    const cards=[...document.querySelectorAll('#stats .stat')];
    const card=cards.find(item=>/Offene Rechnungen/i.test(item.querySelector('span')?.textContent||''));
    if(!card)return;
    const rows=outstanding(),total=rows.reduce((sum,item)=>sum+amount(item),0);
    card.classList.add('dashboard-invoice-link');
    card.tabIndex=0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label',`${rows.length} offene Rechnungen anzeigen`);
    card.title='Offene Rechnungen anzeigen';
    const value=card.querySelector('b');
    if(value)value.textContent=money(total);
    let hint=card.querySelector('small');
    if(!hint){hint=document.createElement('small');card.append(hint)}
    hint.textContent=`${rows.length} ${rows.length===1?'Rechnung':'Rechnungen'} anzeigen ›`;
  }

  function renderOutstandingInvoices(){
    document.getElementById('outstandingInvoicePanel')?.remove();
    const rows=outstanding().sort((a,b)=>String(a.flligam||a.faellig||a.datum||'').localeCompare(String(b.flligam||b.faellig||b.datum||'')));
    const panel=document.createElement('section');
    panel.id='outstandingInvoicePanel';
    panel.className='outstanding-invoice-panel';
    panel.innerHTML=`<header><div><small>OFFENE POSTEN</small><h2>${rows.length} ${rows.length===1?'offene Rechnung':'offene Rechnungen'}</h2></div><b>${money(rows.reduce((sum,item)=>sum+amount(item),0))}</b></header>${rows.length?`<div class="outstanding-invoice-list">${rows.map(item=>`<article><div class="outstanding-invoice-main"><strong>${esc(item.rechnungsnr||'Ohne Rechnungsnummer')}</strong><span>${esc(item.kunde||'Kunde nicht eingetragen')}</span></div><div><small>Rechnungsdatum</small><b>${esc(item.datum||'—')}</b></div><div><small>Fällig am</small><b>${esc(item.flligam||item.faellig||'—')}</b></div><div><small>Status</small>${badge(item.status||'Offen')}</div><div class="outstanding-invoice-amount"><small>Betrag</small><b>${money(amount(item))}</b></div><div class="outstanding-invoice-actions"><button class="primary" type="button" onclick="showInvoiceSubtab('editor',${Number(item.row_index)})">Öffnen</button><button class="ghost" type="button" onclick="openStoredInvoicePdf(${Number(item.row_index)})">PDF</button></div></article>`).join('')}</div>`:'<p class="empty">Es gibt derzeit keine offene Rechnung.</p>'}`;
    document.getElementById('invoiceListPanel').prepend(panel);
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  window.openOutstandingInvoices=()=>{
    show('invoices');
    showInvoiceSubtab('list');
    const search=document.querySelector('#invoices .search');
    if(search)search.value='';
    table('invoices');
    renderOutstandingInvoices();
  };

  document.getElementById('stats')?.addEventListener('click',event=>{
    const card=event.target.closest('.dashboard-invoice-link');
    if(card)openOutstandingInvoices();
  });
  document.getElementById('stats')?.addEventListener('keydown',event=>{
    const card=event.target.closest('.dashboard-invoice-link');
    if(card&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openOutstandingInvoices()}
  });

  const renderBeforeInvoiceLink=render;
  render=function(){renderBeforeInvoiceLink();decorateDashboardInvoiceCard()};
  decorateDashboardInvoiceCard();

  const style=document.createElement('style');
  style.textContent=`.dashboard-invoice-link{position:relative;cursor:pointer;transition:transform .15s,box-shadow .15s}.dashboard-invoice-link:hover,.dashboard-invoice-link:focus-visible{transform:translateY(-2px);box-shadow:0 9px 22px #174b8020;outline:2px solid #2d73b8;outline-offset:2px}.dashboard-invoice-link small{display:block;margin-top:7px;color:#1d65a8;font-size:11px;font-weight:800}.outstanding-invoice-panel{margin-bottom:16px;overflow:hidden;border:1px solid #bcd2e8;border-radius:13px;background:#fff;box-shadow:0 8px 24px #173b5f10}.outstanding-invoice-panel>header{display:flex;align-items:center;justify-content:space-between;padding:17px 20px;background:#edf5fd;border-bottom:1px solid #c8d9eb}.outstanding-invoice-panel h2{margin:2px 0 0;font-size:19px}.outstanding-invoice-panel header small{color:#56718d;font-weight:900;letter-spacing:1px}.outstanding-invoice-panel header>b{font-size:21px;color:#174f88}.outstanding-invoice-list{display:grid}.outstanding-invoice-list article{display:grid;grid-template-columns:minmax(180px,1.5fr) repeat(4,minmax(105px,.75fr)) auto;align-items:center;gap:15px;padding:14px 18px;border-bottom:1px solid #e0e8f1}.outstanding-invoice-list article:last-child{border-bottom:0}.outstanding-invoice-list article>div{display:grid;gap:3px}.outstanding-invoice-list small{color:#708297;font-size:10px;text-transform:uppercase;font-weight:800}.outstanding-invoice-main strong{color:#174f88;font-size:15px}.outstanding-invoice-main span{color:#50667d}.outstanding-invoice-amount b{font-size:17px}.outstanding-invoice-actions{display:flex!important;grid-auto-flow:column;gap:6px!important}.outstanding-invoice-actions button{padding:8px 10px}@media(max-width:900px){.outstanding-invoice-list article{grid-template-columns:1fr 1fr}.outstanding-invoice-main{grid-column:1/-1}.outstanding-invoice-actions{grid-column:1/-1}.outstanding-invoice-actions button{flex:1}.outstanding-invoice-panel>header{align-items:flex-start;gap:10px}.outstanding-invoice-panel header>b{font-size:17px}}`;
  document.head.append(style);
})();
