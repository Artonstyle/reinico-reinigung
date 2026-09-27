(() => {
  const endpoint = 'https://script.google.com/macros/s/AKfycbx1ZNwVdTUeUSI0FlDmouOw4gRiO-rwEI5Q23Lq_C4o7_LanhQvrffdSRlkqg-Wb9Ry/exec';
  const page = location.pathname.replace(/\/+$/, '') || '/';

  // Pro Seite und Browser-Tab nur einmal zählen. Es werden keine persönlichen
  // Angaben, IP-Adressen oder Gerätekennungen an das CRM übertragen.
  const key = 'reinico-page-view:' + page;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch (error) {}

  const body = new URLSearchParams({action: 'reinico_page_view', page});
  fetch(endpoint, {method: 'POST', mode: 'no-cors', body, keepalive: true}).catch(() => {});
})();
