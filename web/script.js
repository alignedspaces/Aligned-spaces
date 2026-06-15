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
            
            const inquiryData = {
                name: name,
                email: email,
                service: service,
                message: message
            };
            
            if (window.saveInquiryToCRM) {
                window.saveInquiryToCRM(inquiryData);
            } else {
                console.warn("Firebase not loaded, inquiry not saved.");
            }
            
            // Custom Beige Modal Instead of Alert
            let modal = document.getElementById('custom-success-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'custom-success-modal';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
                modal.style.display = 'flex';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                modal.style.zIndex = '9999';
                
                modal.innerHTML = `
                    <div style="background-color: #F8F3ED; padding: 40px; border-radius: 4px; max-width: 400px; text-align: center; font-family: 'Playfair Display', serif; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative; margin: 20px;">
                        <h3 style="color: #4A3C39; margin-top: 0; font-size: 26px; margin-bottom: 15px;">Inquiry Sent</h3>
                        <div style="background-color: #D3B89B; width: 50px; height: 2px; margin: 0 auto 20px auto;"></div>
                        <p style="color: #2C2B29; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                            Thank you for your inquiry. A member of the ALIGNED SPACES team will contact you shortly to schedule your consultation.
                        </p>
                        <button onclick="document.getElementById('custom-success-modal').style.display='none'" style="background-color: #4A3C39; color: #FDFBF7; border: none; padding: 12px 30px; cursor: pointer; font-family: 'Inter', sans-serif; letter-spacing: 1px; font-size: 13px; font-weight: 500; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">CLOSE</button>
                    </div>
                `;
                document.body.appendChild(modal);
            } else {
                modal.style.display = 'flex';
            }
            
            form.reset();
        });
    }
});
