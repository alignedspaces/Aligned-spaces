/**
 * ALIGNED SPACES — Interactive Quote Calculator
 * All pricing logic and step navigation lives here.
 */

// ============================================================
// SQUARE FOOTAGE TIERS & RATES
// ============================================================

const TIERS = [
    { label: "Under 600 sq ft", mid: 600 },
    { label: "600 – 799 sq ft", mid: 700 },
    { label: "800 – 999 sq ft", mid: 900 },
    { label: "1,000 – 1,199 sq ft", mid: 1100 },
    { label: "1,200 – 1,399 sq ft", mid: 1300 },
    { label: "1,400 – 1,599 sq ft", mid: 1500 },
    { label: "1,600 – 1,799 sq ft", mid: 1700 },
    { label: "1,800 – 1,999 sq ft", mid: 1900 },
    { label: "2,000 – 2,199 sq ft", mid: 2100 },
    { label: "2,200 – 2,399 sq ft", mid: 2300 },
    { label: "2,400 – 2,599 sq ft", mid: 2500 },
    { label: "2,600 – 2,799 sq ft", mid: 2700 },
    { label: "2,800 – 2,999 sq ft", mid: 2900 },
    { label: "3,000 – 3,199 sq ft", mid: 3100 },
    { label: "3,200 – 3,399 sq ft", mid: 3300 },
    { label: "3,400 – 3,599 sq ft", mid: 3500 },
    { label: "3,600 – 3,799 sq ft", mid: 3700 },
    { label: "3,800 – 3,999 sq ft", mid: 3900 },
    { label: "4,000 – 4,999 sq ft", mid: 4500 },
    { label: "5,000 – 6,000 sq ft", mid: 5500 }
];

const RATES = {
    signature: [0.25, 0.25, 0.25, 0.24, 0.24, 0.24, 0.22, 0.22, 0.22, 0.22, 0.22, 0.20, 0.20, 0.20, 0.20, 0.20, 0.19, 0.19, 0.19, 0.19],
    transition: [0.35, 0.35, 0.35, 0.33, 0.33, 0.33, 0.31, 0.31, 0.31, 0.31, 0.29, 0.29, 0.29, 0.29, 0.29, 0.29, 0.29, 0.29, 0.29, 0.29],
    turnover: [0.20, 0.20, 0.20, 0.20, 0.19, 0.19, 0.19, 0.19, 0.19, 0.18, 0.18, 0.18, 0.16, 0.16, 0.16, 0.15, 0.15, 0.15, 0.15, 0.15],
    postconstruction: [0.60, 0.60, 0.60, 0.58, 0.58, 0.56, 0.56, 0.54, 0.52, 0.52, 0.50, 0.50, 0.48, 0.48, 0.47, 0.47, 0.46, 0.46, 0.45, 0.45]
};

function roundPrestige(num) {
    return Math.ceil(num / 10) * 10;
}

function getTierIndex(sqft) {
    if (sqft < 600) return 0;
    if (sqft < 800) return 1;
    if (sqft < 1000) return 2;
    if (sqft < 1200) return 3;
    if (sqft < 1400) return 4;
    if (sqft < 1600) return 5;
    if (sqft < 1800) return 6;
    if (sqft < 2000) return 7;
    if (sqft < 2200) return 8;
    if (sqft < 2400) return 9;
    if (sqft < 2600) return 10;
    if (sqft < 2800) return 11;
    if (sqft < 3000) return 12;
    if (sqft < 3200) return 13;
    if (sqft < 3400) return 14;
    if (sqft < 3600) return 15;
    if (sqft < 3800) return 16;
    if (sqft < 4000) return 17;
    if (sqft < 5000) return 18;
    return 19;
}

// ============================================================
// PRICING MATRIX
// ============================================================

const PRICING = {
    signature: {
        getBase(sqft) {
            const idx = getTierIndex(sqft);
            const rate = RATES.signature[idx];
            return roundPrestige(sqft * rate);
        },
        supportsFrequency: true,
        usesSqft: true,
    },
    transition: {
        getBase(sqft) {
            const idx = getTierIndex(sqft);
            const rate = RATES.transition[idx];
            return roundPrestige(sqft * rate);
        },
        supportsFrequency: false,
        usesSqft: true,
    },
    turnover: {
        getBase(sqft) {
            const idx = getTierIndex(sqft);
            const rate = RATES.turnover[idx];
            return roundPrestige(sqft * rate);
        },
        supportsFrequency: false,
        usesSqft: true,
    },
    postconstruction: {
        getBase(sqft) {
            const idx = getTierIndex(sqft);
            const rate = RATES.postconstruction[idx];
            return roundPrestige(sqft * rate);
        },
        supportsFrequency: false,
        usesSqft: true,
    },
    tailored: {
        ratePerHour: 45,
        getBase(hours, cleaners = 1) {
            return (hours || 3) * (cleaners || 1) * this.ratePerHour;
        },
        supportsFrequency: false,
        usesHours: true,
    }
};

const FREQUENCY_DISCOUNTS = {
    onetime:  0,
    monthly:  10,
    biweekly: 15,
    weekly:   20
};

const SERVICE_LABELS = {
    signature:       'The Signature Clean',
    transition:      'The Transition Reset',
    turnover:        'The 5-Star Turnover',
    postconstruction:'The Final Reveal',
    tailored:        'The Tailored Focus'
};

// ============================================================
// STATE
// ============================================================

let state = {
    service:    null,
    exactSqft:  null,
    conditionMultiplier: 1.0,
    // Hourly (Tailored)
    hours:      3,
    cleaners:   1,
    bedrooms:   1,
    bathrooms:  1,
    // Frequency & pricing
    frequency:  null,
    addons:     [],
    addonQuantities: { fridge: 0, oven: 0, windows: 0, windows_out: 0, windows_large: 0, windows_large_out: 0, org: 0, pet: 0 },
    basePrice:  0,
    totalPrice: 0,
    promoCodeApplied: false,
    // Booking
    selectedDate: null,
    selectedTime: null
};

// ============================================================
// STEP NAVIGATION
// ============================================================

function goToStep(num) {
    // Validation before moving to Step 3
    if (num === 3) {
        if (PRICING[state.service]?.usesSqft) {
            if (!state.exactSqft || state.exactSqft <= 0) {
                alert("Please enter your estimated square footage to continue.");
                const inputEl = document.getElementById('sqft-input');
                if (inputEl) inputEl.focus();
                return;
            }
        }
    }

    const steps = document.querySelectorAll('.step-panel');
    steps.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`step-${num}`);
    if (target) target.classList.add('active');

    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach((el, i) => {
        const stepNum = i + 1;
        el.classList.remove('active', 'done');
        if (stepNum <  num) el.classList.add('done');
        if (stepNum === num) el.classList.add('active');
    });
    document.querySelectorAll('.progress-line').forEach((el, i) => {
        el.classList.toggle('done', i < num - 1);
    });

    // Specific setup when entering a step
    if (num === 2) setupStep2();
    if (num === 3) setupStep3();
    if (num === 4) setupStep4();
    if (num === 5) setupStep5();
    
    // Manage Mobile Floating Bar visibility
    const floatingBar = document.getElementById('mobile-floating-bar');
    if (floatingBar) {
        // Show only on steps 2, 3, and 5. Hide on 1 (Service), 4 (Lead Capture), 6 (Booking), 7 (Confirm)
        if (window.innerWidth <= 900 && (num === 2 || num === 3 || num === 5)) {
            floatingBar.style.display = 'block';
        } else {
            floatingBar.style.display = 'none';
        }
        
        // Ensure the button resets its opacity when moving to other steps
        const mobileBtn = document.querySelector('.mfp-btn');
        if (mobileBtn && num !== 2) {
            mobileBtn.disabled = false;
            mobileBtn.style.opacity = '1';
        }
    }
}

function floatingBarNext() {
    const activeStep = document.querySelector('.step-panel.active');
    if (!activeStep) return;
    const stepId = activeStep.id;
    
    if (stepId === 'step-2') {
        // Find and click the native next button so any inline validation triggers
        const nextBtn = document.getElementById('btn-next-2');
        if (nextBtn) nextBtn.click();
        else goToStep(3);
    } else if (stepId === 'step-3') {
        goToStep(4);
    } else if (stepId === 'step-5') {
        showBookingForm();
    }
}

// ============================================================
// STEP 1 — SERVICE SELECTION
// ============================================================

document.querySelectorAll('.service-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.service-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        state.service   = opt.dataset.service;
        state.frequency = null; // reset frequency on service change

        document.getElementById('btn-next-1').disabled = false;
        updatePrice();
    });
});

// ============================================================
// STEP 2 — HOME CONFIGURATION
// ============================================================

function setupStep2() {
    const svc        = state.service;
    const configSqft  = document.getElementById('config-sqft');
    const configHours = document.getElementById('config-hours');
    const configRooms = document.getElementById('config-rooms');
    const configCond  = document.getElementById('config-condition');
    const subtitle    = document.getElementById('step2-subtitle');

    // Hide all config panels first
    configSqft.style.display  = 'none';
    configHours.style.display = 'none';
    if (configRooms) configRooms.style.display = 'none';
    if (configCond) configCond.style.display = 'none';

    if (PRICING[svc]?.usesSqft) {
        configSqft.style.display = 'block';
        if (configRooms) configRooms.style.display = 'block';
        
        // Show condition question for Signature and Transition
        if (configCond && (svc === 'signature' || svc === 'transition')) {
            configCond.style.display = 'block';
        }
        
        subtitle.textContent = 'Enter the exact square footage and number of rooms.';
        
        const inputEl = document.getElementById('sqft-input');
        if (inputEl) {
            inputEl.value = state.exactSqft || ''; // Set value or empty string
            setTimeout(() => inputEl.focus(), 50); // Focus the field so they can type immediately
            inputEl.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (!isNaN(val) && val > 0) {
                    state.exactSqft = val;
                } else {
                    state.exactSqft = null;
                }
                updatePrice();
            });
        }
    } else if (svc === 'tailored') {
        configHours.style.display = 'block';
        subtitle.textContent = 'How many hours would you like? (3-hour minimum)';
    }

    // Toggle the $60/hr note so it only appears for tailored focus
    const hourlyNote = document.getElementById('hourly-note');
    if (hourlyNote) {
        hourlyNote.style.display = (svc === 'tailored') ? 'block' : 'none';
    }

    updatePrice();
}

function changeCount(type, delta) {
    if (type === 'hours') {
        state.hours = Math.max(3, Math.min(12, state.hours + delta));
        document.getElementById('val-hours').textContent = state.hours;
        document.getElementById('btn-hours-minus').disabled = state.hours <= 3;
        document.getElementById('btn-hours-plus').disabled  = state.hours >= 12;

    } else if (type === 'cleaners') {
        state.cleaners = Math.max(1, Math.min(3, state.cleaners + delta));
        document.getElementById('val-cleaners').textContent = state.cleaners;
        document.getElementById('btn-cleaners-minus').disabled = state.cleaners <= 1;
        document.getElementById('btn-cleaners-plus').disabled  = state.cleaners >= 3;
        
    } else if (type === 'bedrooms') {
        state.bedrooms = Math.max(1, Math.min(10, state.bedrooms + delta));
        document.getElementById('val-bedrooms').textContent = state.bedrooms;
        document.getElementById('btn-bedrooms-minus').disabled = state.bedrooms <= 1;
        document.getElementById('btn-bedrooms-plus').disabled  = state.bedrooms >= 10;
        
    } else if (type === 'bathrooms') {
        state.bathrooms = Math.max(1, Math.min(10, state.bathrooms + delta));
        document.getElementById('val-bathrooms').textContent = state.bathrooms;
        document.getElementById('btn-bathrooms-minus').disabled = state.bathrooms <= 1;
        document.getElementById('btn-bathrooms-plus').disabled  = state.bathrooms >= 10;
    }
    updatePrice();
}

// ============================================================
// STEP 3 — FREQUENCY
// ============================================================

function setupStep3() {
    const svc        = PRICING[state.service];
    const freqOptions = document.getElementById('frequency-options');
    const freqNotice  = document.getElementById('freq-na-notice');
    const subtitle    = document.getElementById('step3-subtitle');
    const nextBtn     = document.getElementById('btn-next-3');

    if (svc && svc.supportsFrequency) {
        freqOptions.style.display = 'grid';
        freqNotice.style.display  = 'none';
        subtitle.textContent = 'Recurring clients receive preferred rates.';
        nextBtn.disabled = (state.frequency === null);
    } else {
        freqOptions.style.display = 'none';
        freqNotice.style.display  = 'block';
        
        if (state.service === 'turnover') {
            subtitle.textContent = 'Host Partnership Program';
            freqNotice.innerHTML = '<p>✨ <strong>Volume Discounts:</strong> Are you a high-volume host? We offer exclusive Partner Rates (up to 20% off) for hosts with 6+ turnovers per month. Proceed to book your first clean, and our Concierge will contact you to set up your Host Partnership contract.</p>';
            freqNotice.style.borderLeft = '4px solid var(--accent-primary)';
            freqNotice.style.background = '#ffffff';
        } else {
            subtitle.textContent = 'This service is offered as a single visit.';
            freqNotice.innerHTML = '<p>This service is offered as a single visit. We\'ll proceed to optional add-ons.</p>';
            freqNotice.style.borderLeft = '';
            freqNotice.style.background = '';
        }

        state.frequency = 'onetime';
        nextBtn.disabled = false;
    }

    // Hide Community Hero for B2B (Turnover)
    const heroContainer = document.getElementById('hero-discount-container');
    const chkHero = document.getElementById('chkHeroPublic');
    if (heroContainer && chkHero) {
        if (state.service === 'turnover') {
            heroContainer.style.display = 'none';
            chkHero.checked = false;
        } else {
            heroContainer.style.display = 'block';
        }
    }
    updatePrice();
}

function selectCondition(el) {
    document.querySelectorAll('.condition-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    state.conditionMultiplier = parseFloat(el.dataset.condition) || 1.0;
    updatePrice();
}

function selectFreq(el) {
    document.querySelectorAll('.freq-option:not(.condition-option)').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    state.frequency = el.dataset.freq;
    document.getElementById('btn-next-3').disabled = false;
    updatePrice();
}

function setupStep4() {
    // Focus the name input automatically for better UX
    setTimeout(() => {
        const nameInput = document.getElementById('lead-name');
        if (nameInput) nameInput.focus();
    }, 50);
}

function validateLeadCapture() {
    const nameInput = document.getElementById('lead-name').value.trim();
    const emailInput = document.getElementById('lead-email').value.trim();
    const errorMsg = document.getElementById('lead-error-msg');
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (nameInput.length < 2 || !emailRegex.test(emailInput)) {
        errorMsg.style.display = 'block';
    } else {
        errorMsg.style.display = 'none';
        state.leadName = nameInput;
        state.leadEmail = emailInput;
        goToStep(5);
    }
}

function setupStep5() {
    const isTransition = (state.service === 'transition');
    const isTurnover = (state.service === 'turnover');
    const isPostconst = (state.service === 'postconstruction');
    const isTailored = (state.service === 'tailored');
    
    const addonGrid = document.getElementById('main-addon-grid');
    const tailoredNotice = document.getElementById('tailored-addon-notice');
    
    if (isTailored) {
        if (addonGrid) addonGrid.style.display = 'none';
        if (tailoredNotice) tailoredNotice.style.display = 'block';
        // Reset all addons just in case
        document.querySelectorAll('.addon-checkbox').forEach(cb => cb.checked = false);
        for (let key in state.addonQuantities) state.addonQuantities[key] = 0;
        updatePrice();
        return; // Skip setting up addons completely
    } else {
        if (addonGrid) addonGrid.style.display = ''; 
        if (tailoredNotice) tailoredNotice.style.display = 'none';
    }
    
    function setQtyAddonIncluded(cardId, isIncluded, labelText, defaultLabel) {
        const card = document.getElementById(cardId);
        if (!card) return;
        const spans = card.querySelectorAll('.addon-info span');
        const priceSpan = spans[spans.length - 1]; // Always target the last span (the price)
        const counter = card.querySelector('.addon-counter');
        const addonId = cardId.replace('addon-card-', '');
        
        if (isIncluded) {
            priceSpan.textContent = labelText;
            priceSpan.style.color = 'var(--accent-primary)';
            priceSpan.style.fontWeight = '600';
            counter.style.display = 'none';
            state.addonQuantities[addonId] = 0;
            document.getElementById(`qty-${addonId}`).textContent = 0;
        } else {
            priceSpan.textContent = defaultLabel || '$50 per unit';
            priceSpan.style.color = '';
            priceSpan.style.fontWeight = '';
            counter.style.display = 'flex';
        }
    }

    // Helper to toggle checkbox addons
    function setCheckboxAddonIncluded(dataId, isIncluded, defaultPrice, includeLabel) {
        const cb = document.querySelector(`.addon-checkbox[data-id="${dataId}"]`);
        if (!cb) return;
        const card = cb.closest('.addon-card');
        const spans = card.querySelectorAll('.addon-info span');
        let targetSpan = spans[1] || spans[0];
        if (cb.id === 'chk-patio') targetSpan = document.getElementById('price-patio');
        if (cb.id === 'chk-garage') targetSpan = document.getElementById('price-garage');
        
        if (isIncluded) {
            targetSpan.textContent = includeLabel || 'Included';
            targetSpan.style.color = 'var(--accent-primary)';
            targetSpan.style.fontWeight = '600';
            cb.disabled = true;
            cb.checked = false;
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.8';
        } else {
            targetSpan.textContent = `+$${defaultPrice}`;
            targetSpan.style.color = '';
            targetSpan.style.fontWeight = '';
            cb.disabled = false;
            card.style.pointerEvents = 'auto';
            card.style.opacity = '1';
        }
    }

    // Fridge & Oven (Included in Transition & Turnover)
    const fridgeOvenIncluded = isTransition || isTurnover;
    const fridgeOvenLabel = isTransition ? 'Included in Transition Reset' : 'Included in 5-Star Turnover';
    setQtyAddonIncluded('addon-card-fridge', fridgeOvenIncluded, fridgeOvenLabel, '$50 per unit');
    setQtyAddonIncluded('addon-card-oven', fridgeOvenIncluded, fridgeOvenLabel, '$50 per unit');

    // Cabinets (Included in Transition, Turnover & Post-Construction)
    const cabIncluded = isTransition || isTurnover || isPostconst;
    let cabLabel = 'Included';
    if (isTransition) cabLabel = 'Included in Transition Reset';
    else if (isTurnover) cabLabel = 'Included in 5-Star Turnover';
    else if (isPostconst) cabLabel = 'Included in Post-Construction';
    setCheckboxAddonIncluded('cabinets', cabIncluded, 50, cabLabel);

    // Balcony (Included in Turnover & Post-Construction)
    const balconyIncluded = isTurnover || isPostconst;
    let balconyLabel = 'Included';
    if (isTurnover) balconyLabel = 'Included in 5-Star Turnover';
    else if (isPostconst) balconyLabel = 'Included in Post-Construction';
    setCheckboxAddonIncluded('balcony', balconyIncluded, 40, balconyLabel);

    // Patio (Included in Turnover)
    setCheckboxAddonIncluded('patio', isTurnover, 80, 'Included in 5-Star Turnover'); 

    // Windows (Included in Post-Construction)
    setQtyAddonIncluded('addon-card-windows', isPostconst, 'Included in Post-Construction', '$8');
    setQtyAddonIncluded('addon-card-windows_out', isPostconst, 'Included in Post-Construction', '$15');
    setQtyAddonIncluded('addon-card-windows_large', isPostconst, 'Included in Post-Construction', '$15');
    setQtyAddonIncluded('addon-card-windows_large_out', isPostconst, 'Included in Post-Construction', '$30');
    
    // Dynamic Pricing for Garage and Patio (when NOT included)
    const chkGarage = document.getElementById('chk-garage');
    const priceGarage = document.getElementById('price-garage');
    const chkPatio = document.getElementById('chk-patio');
    const pricePatio = document.getElementById('price-patio');

    if (chkGarage && priceGarage) {
        if (state.service === 'transition') {
            chkGarage.dataset.price = '90';
            priceGarage.textContent = '+$90';
        } else if (state.service === 'postconstruction') {
            chkGarage.dataset.price = '100';
            priceGarage.textContent = '+$100';
        } else {
            chkGarage.dataset.price = '60';
            priceGarage.textContent = '+$60';
        }
    }

    if (chkPatio && pricePatio && !isTurnover) {
        if (state.service === 'transition') {
            chkPatio.dataset.price = '80';
            pricePatio.textContent = '+$80';
        } else {
            chkPatio.dataset.price = '70';
            pricePatio.textContent = '+$70';
        }
    }

    // Hide Organization for Turnover
    const orgCb = document.querySelector('.addon-checkbox[data-id="org"]');
    if (orgCb) {
        const orgCard = orgCb.closest('.addon-card');
        if (isTurnover) {
            orgCard.style.display = 'none';
            orgCb.checked = false;
        } else {
            orgCard.style.display = '';
        }
    }

    // Hide Emergency/Same-Day for everything EXCEPT Turnover
    const emergencyCb = document.querySelector('.addon-checkbox[data-id="emergency"]');
    if (emergencyCb) {
        const emergencyCard = emergencyCb.closest('.addon-card');
        if (!isTurnover) {
            emergencyCard.style.display = 'none';
            emergencyCb.checked = false;
        } else {
            emergencyCard.style.display = '';
        }
    }

    updatePrice();
}

// ============================================================
// PRICE CALCULATION ENGINE
// ============================================================

function applyPromoCode() {
    const input = document.getElementById('promo-code-input');
    const msg = document.getElementById('promo-code-message');
    const code = input.value.trim().toUpperCase();
    
    if (code === 'LAUNCH20') {
        state.promoCodeApplied = true;
        state.promoCodeType = 'LAUNCH20';
        msg.textContent = 'Promo code applied! 20% off your service.';
        msg.style.color = 'var(--accent-primary)';
        msg.style.display = 'block';
        updatePrice();
    } else {
        state.promoCodeApplied = false;
        state.promoCodeType = null;
        msg.textContent = 'Invalid promo code.';
        msg.style.color = '#dc2626';
        msg.style.display = 'block';
        updatePrice();
    }
}

function updatePrice() {
    const service = state.service;
    if (!service) return;

    // Mansion check
    const isMansion = (state.exactSqft >= 4000);
    const mansionWarning = document.getElementById('mansion-warning');
    const nextBtn2 = document.getElementById('btn-next-2');
    
    if (mansionWarning) {
        mansionWarning.style.display = (isMansion && PRICING[service]?.usesSqft) ? 'block' : 'none';
    }
    
    if (nextBtn2) {
        if (PRICING[service]?.usesSqft) {
            nextBtn2.disabled = (isMansion || !state.exactSqft || state.exactSqft < 100);
        } else {
            nextBtn2.disabled = false;
        }
        
        // Sync the mobile floating bar button if we are on step 2
        const mobileBtn = document.querySelector('.mfp-btn');
        if (mobileBtn && document.getElementById('step-2').classList.contains('active')) {
            mobileBtn.disabled = nextBtn2.disabled;
            mobileBtn.style.opacity = nextBtn2.disabled ? '0.5' : '1';
        }
    }

    // Reset add-on disabled state
    document.querySelectorAll('.addon-card input').forEach(input => {
        input.disabled = false;
        input.parentElement.classList.remove('included');
    });

    // Recommendation notice (Upsell for Signature Clean)
    const notice = document.getElementById('addon-recommendation');
    if (notice) notice.style.display = (service === 'signature') ? 'block' : 'none';

    const pricing = PRICING[service];
    let pureBase = 0;

    if (pricing.usesSqft) {
        let minSqft = (service === 'turnover') ? 500 : 600;
        let calcSqft = Math.max(minSqft, state.exactSqft || 0);
        pureBase = pricing.getBase(calcSqft);
    } else if (service === 'tailored') {
        pureBase = pricing.getBase(state.hours, state.cleaners);
    }

    let base = pureBase;
    if (service === 'signature' || service === 'transition') {
        base = roundPrestige(pureBase * state.conditionMultiplier);
    }

    state.basePrice = base;

    // Discounts
    let maxDiscPercent = 0;
    let maxDiscLabel = '';

    let isRecurringSignature = (service === 'signature' && state.frequency && state.frequency !== 'onetime');

    // Frequency
    if (state.frequency && state.frequency !== 'onetime') {
        const freqPct = FREQUENCY_DISCOUNTS[state.frequency] || 0;
        if (freqPct > maxDiscPercent) {
            maxDiscPercent = freqPct;
            const freqLabels = { monthly: 'Monthly', biweekly: 'Bi-Weekly', weekly: 'Weekly' };
            maxDiscLabel = `${freqLabels[state.frequency]} (−${freqPct}%)`;
        }
    }

    // Community Hero
    const chkHero = document.getElementById('chkHeroPublic');
    if (chkHero && chkHero.checked && service !== 'turnover') {
        if (10 > maxDiscPercent) {
            maxDiscPercent = 10;
            maxDiscLabel = `Community Hero (−10%)`;
        }
    }

    // Promo Code Logic (Max Discount Wins - Non Stacking)
    if (state.promoCodeApplied && state.promoCodeType === 'LAUNCH20') {
        if (20 > maxDiscPercent) {
            maxDiscPercent = 20;
            maxDiscLabel = `Launch Promo (−20%)`;
        }
    }

    // Add-ons — checkboxes
    let addonsTotal = 0;
    state.addons = [];

    document.querySelectorAll('.addon-checkbox:checked').forEach(input => {
        const price = parseInt(input.dataset.price) || 0;
        state.addons.push({ id: input.dataset.id, label: input.dataset.label, price });
        addonsTotal += price;
    });

    // Add-ons — quantity counters (Fridge / Oven / Org / Windows / Pet)
    const counters = [
        { id: 'fridge', label: 'Inside Fridge',           price: 50 },
        { id: 'oven',   label: 'Inside Oven',             price: 60 },
        { id: 'windows',label: 'Windows (Inside Only)',   price: 10 },
        { id: 'windows_out',label: 'Windows (Inside & Out)', price: 15 },
        { id: 'windows_large',label: 'Large Windows (Inside)', price: 15 },
        { id: 'windows_large_out',label: 'Large Windows (In & Out)', price: 30 },
        { id: 'org',    label: 'Organization (hr)',       price: 35 },
        { id: 'pet',    label: 'Pet Hair Fee',            price: 25 }
    ];
    counters.forEach(c => {
        const qty  = state.addonQuantities[c.id];
        const card = document.getElementById(`addon-card-${c.id}`);
        if (qty > 0) {
            card.classList.add('selected');
            state.addons.push({ id: c.id, label: `${c.label} (x${qty})`, price: c.price * qty });
            addonsTotal += c.price * qty;
        } else {
            card.classList.remove('selected');
        }
    });

    let discountAmt = 0;
    let recurringTotal = 0;

    if (isRecurringSignature) {
        // First Visit logic: doesn't get frequency discount, only gets Promo/Hero if checked
        let firstVisitDiscPercent = 0;
        let firstVisitDiscLabel = '';
        
        if (state.promoCodeApplied && state.promoCodeType === 'LAUNCH20') {
            firstVisitDiscPercent = 20;
            firstVisitDiscLabel = `Launch Promo (−20%)`;
        } else if (chkHero && chkHero.checked) {
            firstVisitDiscPercent = 10;
            firstVisitDiscLabel = `Community Hero (−10%)`;
        }
        
        discountAmt = Math.round(base * (firstVisitDiscPercent / 100));
        maxDiscLabel = firstVisitDiscLabel; 
        
        state.totalPrice = base + addonsTotal - discountAmt;
        
        // Recurring Total uses the PURE BASE (1.0x condition)
        let freqPct = FREQUENCY_DISCOUNTS[state.frequency] || 0;
        let recurringDiscountAmt = Math.round(pureBase * (freqPct / 100));
        recurringTotal = pureBase + addonsTotal - recurringDiscountAmt;
    } else {
        discountAmt = Math.round(base * (maxDiscPercent / 100));
        state.totalPrice = base + addonsTotal - discountAmt;
    }

    renderPrice(base, maxDiscLabel, discountAmt, addonsTotal, state.totalPrice, isRecurringSignature, recurringTotal, pureBase);
}

function renderPrice(base, maxDiscLabel, discountAmt, addonsTotal, total, isRecurringSignature = false, recurringTotal = 0, pureBase = 0) {
    const display    = document.getElementById('price-display');
    const breakdown  = document.getElementById('price-breakdown');
    const note       = document.getElementById('price-note');

    const isReady = state.service && (
        (PRICING[state.service].usesSqft && state.exactSqft > 0) ||
        (state.service === 'tailored' && state.hours >= 3)
    );

    // Animate price update
    display.classList.add('updating');
    setTimeout(() => {
        if (!isReady) {
            display.textContent = '$ --';
        } else {
            display.textContent = `$${total.toLocaleString()}`;
        }
        display.classList.remove('updating');
    }, 150);

    // Post-construction disclaimer
    note.style.display = (state.service === 'postconstruction') ? 'block' : 'none';

    if (!isReady) {
        breakdown.innerHTML = `
            <div style="text-align:center; padding: 2rem 0; opacity: 0.6; font-size: 0.95rem;">
                Select a service and enter your home details to see your instant quote.
            </div>
        `;
        return;
    }

    // ── Config description line ──────────────────────────────
    let configDesc = '';

    if (state.service === 'tailored') {
        configDesc = `${state.cleaners} Cleaner${state.cleaners > 1 ? 's' : ''} · ${state.hours}h each`;
    } else if (PRICING[state.service]?.usesSqft) {
        let minSqft = (state.service === 'turnover') ? 500 : 600;
        let displaySqft = state.exactSqft < minSqft ? `${minSqft} sq ft (Minimum Applied)` : `${state.exactSqft} sq ft`;
        configDesc = `${displaySqft} · ${state.bedrooms} Bed · ${state.bathrooms} Bath`;
    }

    // ── Build breakdown HTML ─────────────────────────────────
    if (isRecurringSignature) {
        // Initial Deep Clean
        html = `<div class="breakdown-item" style="margin-bottom: 0.25rem;">
            <span>Initial Deep Clean<br><small style="opacity:.6">${configDesc}</small></span>
            <span>$${base.toLocaleString()}</span>
        </div>`;
        
        if (state.addons.length > 0) {
            state.addons.forEach(addon => {
                html += `<div class="breakdown-item">
                    <span>${addon.label}</span>
                    <span>+$${addon.price.toLocaleString()}</span>
                </div>`;
            });
        }
        
        html += `<div class="breakdown-item" style="border-top:1px solid rgba(253,251,247,0.2); margin-top:.5rem; padding-top:.5rem;">
            <strong>First Visit Total</strong>
            <strong>$${total.toLocaleString()}</strong>
        </div>`;
        
        // Recurring Maintenance
        html += `<div class="breakdown-item" style="margin-top: 1.5rem; margin-bottom: 0.25rem;">
            <span>Recurring ${SERVICE_LABELS[state.service]}<br><small style="opacity:.6">${configDesc}</small></span>
            <span>$${pureBase.toLocaleString()}</span>
        </div>`;
        
        if (discountAmt > 0) {
            html += `<div class="breakdown-item discount">
                <span>${maxDiscLabel || 'Discount'}</span>
                <span>−$${discountAmt.toLocaleString()}</span>
            </div>`;
        }
        
        if (state.addons.length > 0) {
            state.addons.forEach(addon => {
                html += `<div class="breakdown-item">
                    <span>${addon.label}</span>
                    <span>+$${addon.price.toLocaleString()}</span>
                </div>`;
            });
        }
        
        html += `<div class="breakdown-item" style="border-top:1px dashed rgba(253,251,247,0.2); margin-top:.5rem; padding-top:.5rem; color: var(--gold);">
            <strong>Recurring Visits</strong>
            <strong>$${recurringTotal.toLocaleString()}</strong>
        </div>`;
        
    } else {
        html += `<div class="breakdown-item">
            <span>${SERVICE_LABELS[state.service]}<br><small style="opacity:.6">${configDesc}</small></span>
            <span>$${base.toLocaleString()}</span>
        </div>`;

        if (discountAmt > 0) {
            html += `<div class="breakdown-item discount">
                <span>${maxDiscLabel || 'Discount'}</span>
                <span>−$${discountAmt.toLocaleString()}</span>
            </div>`;
        }

        if (state.addons.length > 0) {
            state.addons.forEach(addon => {
                html += `<div class="breakdown-item">
                    <span>${addon.label}</span>
                    <span>+$${addon.price.toLocaleString()}</span>
                </div>`;
            });
        }

        html += `<div class="breakdown-item" style="border-top:1px solid rgba(253,251,247,0.2); margin-top:.5rem; padding-top:.5rem;">
            <strong>Total Estimate</strong>
            <strong>$${total.toLocaleString()}</strong>
        </div>`;
    }

    if (total > 0) {
        let deposit = total * 0.20;
        html += `<div class="breakdown-item" style="margin-top:.25rem; font-size:0.85rem; color:var(--text-secondary);">
            <span>20% Deposit to secure booking</span>
            <span style="font-weight: 600; color: var(--text-primary);">$${deposit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} today</span>
        </div>`;
        
        if (state.service === 'signature' || state.service === 'transition') {
            html += `<div style="font-size: 0.75rem; color: var(--soft-gray); font-style: italic; margin-top: 1.5rem; line-height: 1.4; padding: 0.75rem; background: rgba(0,0,0,0.15); border-radius: 6px; border-left: 2px solid var(--accent-primary);">
                *This estimate assumes the home condition was selected accurately. If our team arrives and determines the home requires a Heavy Duty deep clean that significantly exceeds normal cleaning time, we will pause and request your approval for any necessary price adjustments before proceeding.
            </div>`;
        }
    }

    breakdown.innerHTML = html;
    
    // Update Mobile Floating Bar Total
    const mobileTotalEl = document.getElementById('mobile-floating-total');
    if (mobileTotalEl) {
        mobileTotalEl.innerText = `$${state.totalPrice.toLocaleString()}`;
    }
}

// ============================================================
// STEP 4 → BOOKING FORM
// ============================================================

async function showBookingForm() {
    goToStep(6);

    // Pre-fill lead capture info
    const bName = document.getElementById('b-name');
    const bEmail = document.getElementById('b-email');
    if (bName) bName.value = state.leadName || '';
    if (bEmail) bEmail.value = state.leadEmail || '';

    // Dynamic time slots for longer services
    const morningSlot = document.querySelector('.time-slot[data-time="9-10am"]');
    if (morningSlot) {
        const isLongService =
            state.service === 'postconstruction' ||
            state.service === 'transition' ||
            (state.service === 'tailored' && state.hours >= 4);

        if (isLongService) {
            morningSlot.querySelector('strong').innerText = 'Early Morning';
            morningSlot.querySelector('span').innerText   = '8:00 AM – 9:00 AM Arrival';
        } else {
            morningSlot.querySelector('strong').innerText = 'Morning';
            morningSlot.querySelector('span').innerText   = '9:00 AM – 10:00 AM Arrival';
        }
    }

    // ── Inline quote summary ─────────────────────────────────
    const summary    = document.getElementById('quote-summary-inline');
    const freqLabels = { onetime: 'One-Time', monthly: 'Monthly', biweekly: 'Bi-Weekly', weekly: 'Weekly' };
    let lines = [];

    lines.push(`<strong>Service:</strong> ${SERVICE_LABELS[state.service]}`);

    if (state.service === 'tailored') {
        lines.push(`<strong>Setup:</strong> ${state.cleaners} Cleaner${state.cleaners > 1 ? 's' : ''} · ${state.hours}h each`);
    } else if (PRICING[state.service]?.usesSqft) {
        let minSqft = (state.service === 'turnover') ? 500 : 600;
        let displaySqft = state.exactSqft < minSqft ? `${minSqft} sq ft (Minimum Applied)` : `${state.exactSqft} sq ft`;
        lines.push(`<strong>Size:</strong> ${displaySqft}`);
    }

    lines.push(`<strong>Frequency:</strong> ${freqLabels[state.frequency]}`);

    if (state.addons.length > 0) {
        lines.push(`<strong>Add-Ons:</strong> ${state.addons.map(a => a.label).join(', ')}`);
    }

    lines.push(`<strong style="color:var(--accent-primary); margin-top:8px; display:block;">Estimated Total: $${state.totalPrice.toLocaleString()}</strong>`);

    summary.innerHTML = lines.join('<br>');

    // Populate hidden field for form submission
    const quoteData = {
        service:    SERVICE_LABELS[state.service],
        sqftLabel:  PRICING[state.service]?.usesSqft ? `${state.exactSqft} sq ft` : null,
        hours:      state.hours,
        cleaners:   state.cleaners,
        frequency:  freqLabels[state.frequency],
        addons:     state.addons.map(a => a.label),
        total:      state.totalPrice,
        date:       state.selectedDate,
        time:       state.selectedTime
    };
    document.getElementById('b-quote-data').value = JSON.stringify(quoteData);

    // ── INITIALIZE STRIPE PAYMENT ELEMENT ────────────────────
    const container = document.getElementById('card-element');
    container.innerHTML = ''; // Clear loading state

    try {
        // We use Stripe's "Deferred Intent" mode.
        // We charge a 20% deposit to secure the booking.
        let depositAmount = state.totalPrice * 0.20;
        let renderAmount = Math.round(depositAmount * 100);
        if (renderAmount < 100) renderAmount = 100; // Stripe requires minimum 100 cents.

        elements = stripe.elements({ 
            mode: 'payment',
            amount: renderAmount,
            currency: 'usd',
            locale: 'en',
            captureMethod: 'manual',
            paymentMethodTypes: ['card'],
            appearance: { theme: 'stripe' }
        });

        const paymentElement = elements.create('payment', {
            layout: 'tabs', // Shows Card / ACH Bank
            paymentMethodOrder: ['card', 'us_bank_account']
        });
        
        paymentElement.mount('#card-element');

        paymentElement.on('change', function(event) {
            var displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="padding: 15px; color: #b91c1c;">Error loading Stripe UI.</div>`;
    }
}

// ============================================================
// BOOKING FORM SUBMISSION
// ============================================================

async function submitBooking(e) {
    e.preventDefault();

    if (!state.selectedDate || !state.selectedTime) {
        alert("Please select a date and time for your cleaning.");
        return;
    }

    const submitBtn = e.target.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    const name = document.getElementById('b-name').value;
    const email = document.getElementById('b-email').value;
    const phone = document.getElementById('b-phone').value;
    const addr = document.getElementById('b-address').value;
    const notes = document.getElementById('b-notes').value;

    const quote = JSON.parse(document.getElementById('b-quote-data').value);

    try {
        // 1. Trigger form validation on the Stripe element
        const {error: submitError} = await elements.submit();
        if (submitError) {
            document.getElementById('card-errors').textContent = submitError.message;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reserve Appointment ✓';
            return;
        }

        // 2. Fetch the client secret from our backend ONLY when they click submit
        let depositAmountCents = Math.round((quote.total * 0.20) * 100);
        if (depositAmountCents < 50) depositAmountCents = 50; // Stripe minimum is $0.50

        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: depositAmountCents,
                service: quote.service,
                name: name,
                email: email
            })
        });

        if (!response.ok) throw new Error("Backend server not reachable.");
        const data = await response.json();
        
        // Wait, if elements isn't defined (because backend failed), this will throw error
        if (!elements) throw new Error("Elements not initialized");

        // 3. Confirm the payment using the secret we just got
        const result = await stripe.confirmPayment({
            elements,
            clientSecret: data.clientSecret, // REQUIRED FOR DEFERRED INTENT
            confirmParams: {
                payment_method_data: {
                    billing_details: {
                        name: name,
                        email: email,
                        phone: phone,
                        address: {
                            line1: addr
                        }
                    }
                }
            },
            redirect: 'if_required' // Don't redirect immediately so we can send email
        });

        if (result.error) {
            document.getElementById('card-errors').textContent = result.error.message;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reserve Appointment ✓';
            return;
        }

        // If payment successful or requires capture
        if (result.paymentIntent && (result.paymentIntent.status === 'requires_capture' || result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing')) {
            const bookingData = { name, email, phone, addr, notes, date: state.selectedDate, time: state.selectedTime, quoteData: quote, total: quote.total, paymentStatus: result.paymentIntent.status, paymentIntentId: result.paymentIntent.id };
            if (window.saveBookingToCRM) window.saveBookingToCRM(bookingData);

            const emailRes = await fetch('/api/send-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name, email, phone, addr, notes, date: state.selectedDate, time: state.selectedTime, quoteData: quote
                })
            });
            const emailData = await emailRes.json();
            if (!emailRes.ok) {
                alert("Payment succeeded but email failed to send: " + (emailData.error || "Unknown error"));
            }
        }
        
        showSuccessScreen();

    } catch (err) {
        console.warn("Backend not running or failed. Falling back to simple email mode for testing.", err);
        // Fallback for testing without a backend server
        
        const bookingData = { name, email, phone, addr, notes, date: state.selectedDate, time: state.selectedTime, quoteData: quote, total: quote.total, paymentStatus: 'Pending (Email Fallback)' };
        if (window.saveBookingToCRM) window.saveBookingToCRM(bookingData);
        
        showSuccessScreen();
    }
}

function showSuccessScreen() {
    setTimeout(() => {
        document.querySelectorAll('.step-panel').forEach(s => s.classList.remove('active'));
        document.getElementById('step-confirm').classList.add('active');

        document.querySelectorAll('.progress-step').forEach(el => {
            el.classList.remove('active');
            el.classList.add('done');
        });
        document.querySelectorAll('.progress-line').forEach(el => el.classList.add('done'));
    }, 500);
}

// ============================================================
// URL PARAMETER — Pre-select service from links on other pages
// ============================================================

function initFromURL() {
    const params = new URLSearchParams(window.location.search);
    const svc    = params.get('service');
    if (svc && document.getElementById(`opt-${svc}`)) {
        document.getElementById(`opt-${svc}`).click();
    }
}

// ============================================================
// STRIPE INITIALIZATION
// ============================================================
let stripe, elements, card;

document.addEventListener('DOMContentLoaded', () => {
    // Initialise counter displays
    document.getElementById('val-hours').textContent       = state.hours;
    document.getElementById('val-cleaners').textContent    = state.cleaners;

    // Counter button initial disabled states
    document.getElementById('btn-hours-minus').disabled       = (state.hours       <= 3);
    document.getElementById('btn-cleaners-minus').disabled    = true;

    initFromURL();

    // Initialise Flatpickr calendar
    flatpickr('#b-date', {
        inline:     true,
        minDate:    new Date(new Date().setDate(new Date().getDate() + 2)),
        dateFormat: 'F j, Y',
        disable: [
            function(date) {
                // Disable Thursday (4), Friday (5), and Saturday (6)
                return (date.getDay() === 4 || date.getDay() === 5 || date.getDay() === 6);
            }
        ],
        onChange(selectedDates, dateStr) {
            state.selectedDate = dateStr;
        }
    });

    // IMPORTANT: Replace the 'pk_test_...' below with your LIVE Publishable Key from Stripe before launching!
    const STRIPE_PUBLIC_KEY = 'pk_live_51Tbqx4LeIlal1UjqY8YdrljZFvlR9ZiKm2Xiq3wuRUIVfaJYNQOC8jPqtWbIHPrLI54gy85zqZSiNc5gCNHB2P1n000n4EUBG8';
    stripe = Stripe(STRIPE_PUBLIC_KEY);
});

function selectTimeSlot(el) {
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('selected-time').value = el.dataset.time;
    state.selectedTime = el.querySelector('span').innerText;
}

function changeAddonQty(id, delta) {
    let max = 20; // Default max for most addons like windows and pets
    if (id === 'org') max = 6;
    if (id === 'windows_large' || id === 'windows_large_out') max = 10;
    
    state.addonQuantities[id] = Math.max(0, Math.min(max, (state.addonQuantities[id] || 0) + delta));
    document.getElementById(`qty-${id}`).textContent = state.addonQuantities[id];
    updatePrice();
}
