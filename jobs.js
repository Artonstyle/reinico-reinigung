(() => {
    const endpoint = 'https://script.google.com/macros/s/AKfycbx1ZNwVdTUeUSI0FlDmouOw4gRiO-rwEI5Q23Lq_C4o7_LanhQvrffdSRlkqg-Wb9Ry/exec';
    const form = document.getElementById('applicationForm');
    const availability = document.getElementById('jobsAvailability');
    const state = document.getElementById('applicationState');
    const button = form.querySelector('button[type="submit"]');
    const positions = [{key: 'reinigung', value: 'Reinigungskraft'}, {key: 'hausmeister', value: 'Hausmeister-Assistent'}];

    async function loadJobs() {
        try {
            const response = await fetch(endpoint, {method: 'POST', body: new URLSearchParams({action: 'reinico_jobs_status'})});
            const result = await response.json();
            if (!response.ok || result.result !== 'success') throw new Error('Stellenstatus nicht verfügbar');
            const open = positions.filter(position => result.jobs?.[position.key]);
            positions.forEach(position => {
                const card = document.querySelector(`[data-job="${position.key}"]`);
                card.hidden = !result.jobs?.[position.key];
            });
            form.querySelectorAll('[data-dynamic-position]').forEach(option => option.remove());
            open.forEach(position => form.elements.stelle.add(new Option(position.value, position.value)));
            [...form.elements.stelle.options].slice(2).forEach(option => option.dataset.dynamicPosition = 'true');
            availability.textContent = open.length ? 'Aktuell sind folgende Stellen offen:' : 'Aktuell haben wir keine offenen Stellen ausgeschrieben. Initiativbewerbungen sind willkommen.';
        } catch (error) {
            availability.textContent = 'Aktuelle Stellen können gerade nicht abgerufen werden. Eine Initiativbewerbung ist weiterhin möglich.';
        }
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        button.disabled = true;
        state.textContent = 'Bewerbung wird gesendet …';
        const body = new FormData(form);
        body.set('target', 'Bewerbungen');
        try {
            const response = await fetch(endpoint, {method: 'POST', body});
            const result = await response.json();
            if (!response.ok || result.result !== 'success') throw new Error(result.msg || 'Senden fehlgeschlagen');
            state.textContent = result.notifications?.admin ? 'Vielen Dank! Deine Bewerbung ist eingegangen.' : 'Deine Bewerbung wurde gespeichert. Die E-Mail-Benachrichtigung konnte nicht bestätigt werden. Bitte nicht erneut senden.';
            state.style.color = '#166534';
            form.reset();
        } catch (error) {
            state.textContent = 'Die Bewerbung konnte nicht gesendet werden. Bitte versuche es später erneut oder schreibe an reinico.gebaeudereinigung@gmx.de.';
            state.style.color = '#991b1b';
        } finally {
            button.disabled = false;
        }
    });

    loadJobs();
})();
