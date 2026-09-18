(() => {
    const endpoint = 'https://script.google.com/macros/s/AKfycbx1ZNwVdTUeUSI0FlDmouOw4gRiO-rwEI5Q23Lq_C4o7_LanhQvrffdSRlkqg-Wb9Ry/exec';
    const form = document.getElementById('applicationForm');
    const availability = document.getElementById('jobsAvailability');
    const state = document.getElementById('applicationState');
    const button = form.querySelector('button[type="submit"]');
    const cards = document.getElementById('jobCards');
    const applicationSection = document.getElementById('applicationSection');
    const selectedJob = document.getElementById('selectedJob');
    const positions = [{key: 'reinigung', value: 'Reinigungskraft'}, {key: 'hausmeister', value: 'Hausmeister-Assistent'}];
    let selectedLocation = '';

    function openApplication(position, location) {
        selectedLocation = location;
        form.elements.stelle.value = position;
        selectedJob.textContent = position === 'Initiativbewerbung' ? 'Initiativbewerbung' : `${position}${location ? ` · Einsatzort: ${location}` : ''}`;
        selectedJob.hidden = false;
        applicationSection.hidden = false;
        applicationSection.scrollIntoView({behavior: 'smooth', block: 'start'});
        form.elements.name.focus({preventScroll: true});
    }

    function addJobCard(position, location, types) {
        const card = document.createElement('article');
        card.className = 'job-card';
        const copy = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = `${position.value} (m/w/d)`;
        const detail = document.createElement('p');
        detail.textContent = [location ? `Ort: ${location}` : '', types.join(' / ')].filter(Boolean).join(' · ');
        copy.append(title, detail);
        const apply = document.createElement('button');
        apply.type = 'button';
        apply.textContent = 'Bewerben';
        apply.setAttribute('aria-label', `Für ${position.value} in ${location || 'der ausgeschriebenen Region'} bewerben`);
        apply.addEventListener('click', () => openApplication(position.value, location));
        card.append(copy, apply);
        cards.append(card);
    }

    document.getElementById('initiativeButton').addEventListener('click', () => openApplication('Initiativbewerbung', ''));
    form.elements.stelle.addEventListener('change', () => {
        selectedLocation = '';
        selectedJob.textContent = form.elements.stelle.value || '';
        selectedJob.hidden = !form.elements.stelle.value;
    });

    async function loadJobs() {
        try {
            const response = await fetch(endpoint, {method: 'POST', body: new URLSearchParams({action: 'reinico_jobs_status'})});
            const result = await response.json();
            if (!response.ok || result.result !== 'success') throw new Error('Stellenstatus nicht verfügbar');
            const open = positions.filter(position => result.jobs?.[position.key]);
            cards.replaceChildren();
            positions.forEach(position => {
                if (!result.jobs?.[position.key]) return;
                const location = String(result.jobs?.[`${position.key}Ort`] || '').trim();
                const types = Array.isArray(result.jobs?.[`${position.key}Arten`]) ? result.jobs[`${position.key}Arten`].filter(type => ['Vollzeit', 'Teilzeit', 'Minijob'].includes(type)) : [];
                const locations = [...new Set(location.split(/[,;\n]+/).map(place => place.trim()).filter(Boolean))];
                (locations.length ? locations : ['']).forEach(place => addJobCard(position, place, types));
            });
            form.querySelectorAll('[data-dynamic-position]').forEach(option => option.remove());
            open.forEach(position => form.elements.stelle.add(new Option(position.value, position.value)));
            [...form.elements.stelle.options].slice(2).forEach(option => option.dataset.dynamicPosition = 'true');
            availability.textContent = cards.childElementCount ? 'Aktuell sind folgende Stellen offen:' : 'Aktuell haben wir keine offenen Stellen ausgeschrieben. Initiativbewerbungen sind willkommen.';
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
        if (selectedLocation) body.set('nachricht', `Einsatzort: ${selectedLocation}\n\n${body.get('nachricht')}`);
        try {
            const response = await fetch(endpoint, {method: 'POST', body});
            const result = await response.json();
            if (!response.ok || result.result !== 'success') throw new Error(result.msg || 'Senden fehlgeschlagen');
            state.textContent = result.notifications?.admin ? 'Vielen Dank! Deine Bewerbung ist eingegangen.' : 'Deine Bewerbung wurde gespeichert. Die E-Mail-Benachrichtigung konnte nicht bestätigt werden. Bitte nicht erneut senden.';
            state.style.color = '#166534';
            form.reset();
            selectedLocation = '';
        } catch (error) {
            state.textContent = 'Die Bewerbung konnte nicht gesendet werden. Bitte versuche es später erneut oder schreibe an reinico.gebaeudereinigung@gmx.de.';
            state.style.color = '#991b1b';
        } finally {
            button.disabled = false;
        }
    });

    loadJobs();
})();
