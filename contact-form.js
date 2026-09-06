(() => {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbw4R0jz2dtvAhoKZ6TFTyooKn3KDQAg25QUdve9IxO1R4ypvhZd1HwhIlCusxwIk10/exec';

    document.querySelectorAll('form[data-reinico-contact]').forEach(form => {
        const button = form.querySelector('button[type="submit"]');
        if (!button) return;

        const originalButtonContent = button.innerHTML;
        const responseMessage = document.createElement('div');
        responseMessage.setAttribute('role', 'status');
        responseMessage.setAttribute('aria-live', 'polite');
        responseMessage.style.cssText = 'display:none; margin-top:20px; padding:15px; border-radius:8px; text-align:center; font-weight:bold;';
        form.appendChild(responseMessage);

        form.addEventListener('submit', async event => {
            event.preventDefault();
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> WIRD GESENDET...';
            responseMessage.style.display = 'none';

            const formData = new FormData(form);
            formData.set('leistung', form.dataset.service || document.title);

            const standardFields = new Set(['name', 'email', 'telefon', 'leistung', 'nachricht']);
            const additionalDetails = [];
            for (const [fieldName, fieldValue] of formData.entries()) {
                if (!standardFields.has(fieldName) && typeof fieldValue === 'string' && fieldValue.trim()) {
                    additionalDetails.push(`${fieldName}: ${fieldValue.trim()}`);
                }
            }
            const message = String(formData.get('nachricht') || '').trim();
            if (additionalDetails.length) {
                formData.set('nachricht', `${additionalDetails.join('\n')}\n\n${message}`);
            }

            try {
                await fetch(scriptURL, { method: 'POST', body: formData });
                responseMessage.textContent = 'Vielen Dank! Ihre Anfrage wurde erfolgreich versendet.';
                responseMessage.style.backgroundColor = '#dcfce7';
                responseMessage.style.color = '#166534';
                responseMessage.style.display = 'block';
                form.reset();

                window.setTimeout(() => {
                    responseMessage.style.display = 'none';
                }, 4000);
            } catch (error) {
                responseMessage.textContent = 'Fehler beim Senden! Bitte versuchen Sie es erneut.';
                responseMessage.style.backgroundColor = '#fee2e2';
                responseMessage.style.color = '#991b1b';
                responseMessage.style.display = 'block';
            } finally {
                button.disabled = false;
                button.innerHTML = originalButtonContent;
            }
        });
    });
})();
