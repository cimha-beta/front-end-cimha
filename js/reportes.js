// ============================================ //
// REPORTES.JS                                  //
// ============================================ //

// ============================================ //
// 1. DATOS                                     //
// ============================================ //

const data = {
    'Córdoba': ['Montería', 'Cereté', 'Lorica', 'Ciénaga de Oro']
};

const types = [
    { label: 'Falla técnica', icon: 'build' },
    { label: 'Error en datos', icon: 'database' },
    { label: 'Problema de acceso', icon: 'lock' },
    { label: 'Sugerencia', icon: 'lightbulb' },
    { label: 'Otro', icon: 'more_horiz' }
];

// ============================================ //
// 2. VARIABLES DE ESTADO                       //
// ============================================ //

let currentTypeIndex = 0;
let selectedReportType = types[0].label;
let selectedDept = null;
let selectedMuni = null;
let activeSelectionType = null;

// ============================================ //
// 3. REFERENCIAS A ELEMENTOS DOM               //
// ============================================ //

const track = document.getElementById('carousel-track');
const labelsTrack = document.getElementById('carousel-labels');
const submitBtn = document.getElementById('submit-button');
const emailInput = document.getElementById('email-input');
const subjectInput = document.getElementById('subject-input');
const descInput = document.getElementById('desc-input');
const backButton = document.getElementById('back-button');

const deptTrigger = document.getElementById('dept-trigger');
const deptText = document.getElementById('dept-selected-text');
const deptIcon = document.getElementById('dept-icon');
const deptList = document.getElementById('dept-list');

const muniTrigger = document.getElementById('muni-trigger');
const muniText = document.getElementById('muni-selected-text');
const muniIcon = document.getElementById('muni-icon');
const muniList = document.getElementById('muni-list');

// ============================================ //
// 4. CARRUSEL                                  //
// ============================================ //

function initCarousel() {
    track.innerHTML = types.map(type => `
        <div class="type-icon">
            <span class="material-symbols-outlined">${type.icon}</span>
        </div>`).join('');

    labelsTrack.innerHTML = types.map(type => `
        <span class="type-label">${type.label}</span>`).join('');

    updateCarouselPosition();
}

function updateCarouselPosition() {
    // Mover solo ícono y texto
    const offset = `translateX(-${currentTypeIndex * 100}%)`;
    track.style.transform = offset;
    labelsTrack.style.transform = offset;

    selectedReportType = types[currentTypeIndex].label;
    validateForm();
}

document.getElementById('prev-report').addEventListener('click', () => {
    currentTypeIndex = (currentTypeIndex - 1 + types.length) % types.length;
    updateCarouselPosition();
});

document.getElementById('next-report').addEventListener('click', () => {
    currentTypeIndex = (currentTypeIndex + 1) % types.length;
    updateCarouselPosition();
});

// ============================================ //
// 5. LISTAS DESPLEGABLES                       //
// ============================================ //

function getParts(type) {
    return type === 'dept'
        ? { trigger: deptTrigger, icon: deptIcon, list: deptList }
        : { trigger: muniTrigger, icon: muniIcon, list: muniList };
}

function toggleDropdown(type) {
    const wasOpen = activeSelectionType === type;
    closeDropdowns();
    if (!wasOpen) openDropdown(type);
}

function openDropdown(type) {
    const options = type === 'dept' ? Object.keys(data) : data[selectedDept];
    if (!options) return;

    const { trigger, list } = getParts(type);
    const currentSelection = type === 'dept' ? selectedDept : selectedMuni;

    list.innerHTML = '';
    options.forEach(opt => {
        const item = document.createElement('li');
        item.textContent = opt;
        item.className = 'option' + (opt === currentSelection ? ' selected' : '');
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectOption(type, opt);
        });
        list.appendChild(item);
    });

    activeSelectionType = type;
    trigger.classList.add('open');
    list.classList.add('open');
}

function closeDropdowns() {
    ['dept', 'muni'].forEach(type => {
        const { trigger, list } = getParts(type);
        trigger.classList.remove('open');
        list.classList.remove('open');
    });
    activeSelectionType = null;
}

deptTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown('dept');
});

muniTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!selectedDept) return;
    toggleDropdown('muni');
});

// Cerrar al hacer clic fuera
document.addEventListener('click', closeDropdowns);

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdowns();
});

// ============================================ //
// 6. SELECCIÓN DE OPCIONES                     //
// ============================================ //

function selectOption(type, val) {
    if (type === 'dept') {
        if (selectedDept !== val) {
            selectedDept = val;
            deptText.textContent = val;

            // Reiniciar municipio
            selectedMuni = null;
            muniText.textContent = 'Selecciona un municipio';
            muniTrigger.disabled = false;
        }
    } else {
        selectedMuni = val;
        muniText.textContent = val;
    }

    validateForm();
    closeDropdowns();
}

// ============================================ //
// 7. VALIDACIÓN DEL FORMULARIO                 //
// ============================================ //

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) && email.toLowerCase().endsWith('.com');
}

function validateForm() {
    // Mínimos iguales al backend (routes/reportes.js)
    const isEmailValid = validateEmail(emailInput.value);
    const isSubjectValid = subjectInput.value.trim().length >= 3;
    const isDescValid = descInput.value.trim().length >= 10;
    const isDeptValid = !!selectedDept;
    const isMuniValid = !!selectedMuni;
    const isTypeValid = !!selectedReportType;

    submitBtn.disabled = !(isEmailValid && isSubjectValid && isDescValid && isDeptValid && isMuniValid && isTypeValid);
}

[emailInput, subjectInput, descInput].forEach(el => {
    el.addEventListener('input', validateForm);
});

// ============================================ //
// 8. ENVÍO DEL FORMULARIO                      //
// ============================================ //

submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    // Evitar doble clic
    submitBtn.disabled = true;

    const reporte = {
        tipo: selectedReportType,
        departamento: selectedDept,
        municipio: selectedMuni,
        email: emailInput.value,
        asunto: subjectInput.value,
        descripcion: descInput.value,
        fecha: new Date().toISOString()
    };

    try {
        const response = await fetch('https://back-end-cimha-production.up.railway.app/webhook/correo-reportes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reporte)
        });

        if (!response.ok) {
            // Mostrar errores de validación del backend
            let detalle = `Error del servidor: ${response.status}`;
            let esValidacion = false;
            try {
                const body = await response.json();
                if (body && Array.isArray(body.errores) && body.errores.length > 0) {
                    detalle = body.errores.join(' ');
                    esValidacion = true;
                }
            } catch (_) {
                // Respuesta sin JSON válido
            }
            const err = new Error(detalle);
            err.esValidacion = esValidacion;
            throw err;
        }

        mostrarModalExito();

    } catch (error) {
        console.error('❌ Error al enviar el reporte:', error);

        // Reactivar para reintentar
        submitBtn.disabled = false;

        alert(error.esValidacion
            ? error.message
            : 'No se pudo enviar el reporte. Verifica tu conexión e inténtalo de nuevo.');
    }
});

// ============================================ //
// 9. MODAL DE ENVÍO EXITOSO                    //
// ============================================ //

const successModal = document.getElementById('success-modal');
const btnVolverInicio = document.getElementById('btn-volver-inicio');
const successVideo = document.getElementById('success-video');

function mostrarModalExito() {
    successModal.classList.remove('hidden');

    // Doble frame para animar la entrada
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            successModal.classList.add('modal-active');
        });
    });

    if (successVideo) {
        successVideo.currentTime = 0;
        successVideo.play();
    }
}

function ocultarModalExito() {
    successModal.classList.remove('modal-active');
    successModal.classList.add('modal-exit');

    if (successVideo) successVideo.pause();

    setTimeout(() => {
        successModal.classList.add('hidden');
        successModal.classList.remove('modal-exit');
    }, 250);
}

// Congelar video en el último frame
if (successVideo) {
    successVideo.addEventListener('ended', () => successVideo.pause());
}

// Volver al inicio con fade
if (btnVolverInicio) {
    btnVolverInicio.addEventListener('click', () => {
        const main = document.querySelector('main');
        main.classList.remove('loaded');
        main.classList.add('fade-out-back');

        successModal.classList.remove('modal-active');
        successModal.classList.add('modal-exit');

        if (successVideo) successVideo.pause();

        setTimeout(() => {
            window.location.href = 'principal.html';
        }, 400);
    });
}

// ============================================ //
// 10. BOTÓN VOLVER                             //
// ============================================ //

backButton.addEventListener('click', () => {
    const main = document.querySelector('main');
    main.classList.remove('loaded');
    main.classList.add('fade-out-back');

    setTimeout(() => {
        window.location.href = 'principal.html';
    }, 400);
});

// ============================================ //
// 11. INICIALIZACIÓN                           //
// ============================================ //

document.addEventListener('DOMContentLoaded', function() {
    initCarousel();
    requestAnimationFrame(() => {
        document.querySelector('main').classList.add('loaded');
    });
});