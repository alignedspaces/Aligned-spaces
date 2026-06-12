document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
        });
    }

    // Form submission
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const inputs = form.querySelectorAll('input, select, textarea');
            const name = inputs[0].value;
            const email = inputs[1].value;
            const service = inputs[2].value || 'General Inquiry';
            const message = inputs[3].value;
            
            const subject = encodeURIComponent(`New Consultation Request: ${name}`);
            let body = `Name: ${name}\nEmail: ${email}\nService Interested In: ${service}\n\nMessage:\n${message}`;
            
            window.location.href = `mailto:hello@alignedspaces.com?subject=${subject}&body=${encodeURIComponent(body)}`;
            
            alert('Thank you for your inquiry. A member of the ALIGNED SPACES team will contact you shortly to schedule your consultation.');
            form.reset();
        });
    }
});
