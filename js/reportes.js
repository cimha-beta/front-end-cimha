// ============================================ //
// REPORTES.JS - JAVASCRIPT                     //
// ============================================ //

/**
 * CIMHA - Reportes
 * Formulario de reportes con carrusel y selectores
 */

// ============================================ //
// 1. DATOS                                      //
// ============================================ //

const data = {
    'Córdoba': ['Montería', 'Cereté', 'Lorica', 'Sahagún', 'Planeta Rica'],
    'Sucre': ['Sincelejo', 'Corozal', 'Tolú', 'Sampués'],
    'Cesar': ['Valledupar', 'Aguachica', 'Agustín Codazzi'],
    'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga'],
    'Bolívar': ['Cartagena', 'Magangué', 'Turbaco'],
    'Magdalena': ['Santa Marta', 'Ciénaga', 'Fundación'],
    'La Guajira': ['Riohacha', 'Maicao', 'Uribia']
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

// ============================================ //
// 3. REFERENCIAS A ELEMENTOS DOM              //
// ============================================ //

const track = document.getElementById('carousel-track');
const submitBtn = document.getElementById('submit-button');
const emailInput = document.getElementById('email-input');
const subjectInput = document.getElementById('subject-input');
const descInput = document.getElementById('desc-input');
const deptTrigger = document.getElementById('dept-trigger');
const deptText = document.getElementById('dept-selected-text');
const muniTrigger = document.getElementById('muni-trigger');
const muniText = document.getElementById('muni-selected-text');
const backButton = document.getElementById('back-button');

// Bottom Sheet
const bsOverlay = document.getElementById('bs-overlay');
const bsContainer = document.getElementById('bottom-sheet-container');
const bsTitle = document.getElementById('bs-title');
const bsList = document.getElementById('bs-list');

// ============================================ //
// 4. CAROUSEL                                  //
// ============================================ //

function initCarousel() {
    track.innerHTML = '';
    types.forEach((type, idx) => {
        const slide = document.createElement('div');
        slide.className = 'w-full flex-shrink-0 flex flex-col items-center justify-center space-y-2 carousel-item';
        slide.style.width = '100%';
        slide.id = `carousel-slide-${idx}`;
        track.appendChild(slide);
    });
    updateCarouselPosition();
}

function updateCarouselPosition() {
    track.style.transform = `translateX(-${currentTypeIndex * 100}%)`;
    selectedReportType = types[currentTypeIndex].label;

    types.forEach((type, idx) => {
        const slide = document.getElementById(`carousel-slide-${idx}`);
        const isActive = idx === currentTypeIndex;
        
        slide.innerHTML = `
            <div class="relative">
                ${isActive ? `
                <div class="bg-blue-500 rounded-full p-1 absolute -top-1 -right-1 z-10 shadow-sm border-2 border-white">
                    <svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path clip-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill-rule="evenodd"></path>
                    </svg>
                </div>
                ` : ''}
                <div class="w-16 h-16 bg-white rounded-2xl shadow-md border-2 ${isActive ? 'border-blue-500' : 'border-slate-100'} flex items-center justify-center ${isActive ? 'text-blue-600' : 'text-slate-400'} transition-all duration-300">
                    <span class="material-symbols-outlined text-4xl">${type.icon}</span>
                </div>
            </div>
            <span class="text-sm font-bold ${isActive ? 'text-blue-900' : 'text-slate-400'} transition-colors duration-300">${type.label}</span>
        `;
    });
    
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
// 5. BOTTOM SHEET                              //
// ============================================ //

function openBottomSheet(title, options, currentValue, onSelect) {
    bsTitle.textContent = title;
    bsList.innerHTML = '';
    bsList.classList.remove('px-6', 'space-y-2');

    options.forEach(opt => {
        const isSelected = opt === currentValue;
        const div = document.createElement('div');
        div.className = `bs-option ${isSelected ? 'selected' : ''}`;
        div.textContent = opt;
        div.onclick = () => {
            onSelect(opt);
            closeBottomSheet();
        };
        bsList.appendChild(div);
    });

    bsContainer.classList.add('bottom-sheet-active');
}

function closeBottomSheet() {
    bsContainer.classList.remove('bottom-sheet-active');
}

bsOverlay.addEventListener('click', closeBottomSheet);

// ============================================ //
// 6. SELECTORES                                //
// ============================================ //

deptTrigger.addEventListener('click', () => {
    openBottomSheet('Seleccionar Departamento', Object.keys(data), selectedDept, (val) => {
        selectedDept = val;
        deptText.textContent = val;
        deptText.classList.add('text-slate-900');
        
        selectedMuni = null;
        muniText.textContent = 'Seleccione un municipio';
        muniText.classList.remove('text-slate-900');
        muniTrigger.disabled = false;
        muniTrigger.classList.remove('opacity-50', 'cursor-not-allowed');
        validateForm();
    });
});

muniTrigger.addEventListener('click', () => {
    if (!selectedDept) return;
    openBottomSheet('Seleccionar Municipio', data[selectedDept], selectedMuni, (val) => {
        selectedMuni = val;
        muniText.textContent = val;
        muniText.classList.add('text-slate-900');
        validateForm();
    });
});

// ============================================ //
// 7. VALIDACIÓN DEL FORMULARIO                //
// ============================================ //

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) && email.toLowerCase().endsWith('.com');
}

function validateForm() {
    const isEmailValid = validateEmail(emailInput.value);
    // Mínimos alineados con la validación del backend (routes/reportes.js):
    // asunto >= 3 caracteres, descripción >= 10 caracteres. Si no coinciden,
    // el botón se habilita con datos que el servidor rechaza con un 400.
    const isSubjectValid = subjectInput.value.trim().length >= 3;
    const isDescValid = descInput.value.trim().length >= 10;
    const isDeptValid = !!selectedDept;
    const isMuniValid = !!selectedMuni;
    const isTypeValid = !!selectedReportType;

    if (isEmailValid && isSubjectValid && isDescValid && isDeptValid && isMuniValid && isTypeValid) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

[emailInput, subjectInput, descInput].forEach(el => {
    el.addEventListener('input', validateForm);
});

// ============================================ //
// 8. ENVÍO DEL FORMULARIO                     //
// ============================================ //

submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    // Deshabilitar botón mientras se envía (evita doble clic)
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reporte)
        });

        if (!response.ok) {
            // El backend devuelve { ok: false, errores: [...] } en un 400 de
            // validación — mostrarlo tal cual ayuda a saber qué campo falló,
            // en vez de solo ver "Error del servidor: 400" en consola.
            let detalle = `Error del servidor: ${response.status}`;
            let esValidacion = false;
            try {
                const data = await response.json();
                if (data && Array.isArray(data.errores) && data.errores.length > 0) {
                    detalle = data.errores.join(' ');
                    esValidacion = true;
                }
            } catch (_) {
                // La respuesta no traía JSON válido; se deja el detalle genérico.
            }
            const err = new Error(detalle);
            err.esValidacion = esValidacion;
            throw err;
        }

        console.log('✅ Reporte enviado correctamente al webhook');

        // Mostrar modal de envío exitoso
        mostrarModalExito();

    } catch (error) {
        console.error('❌ Error al enviar el reporte:', error);
        
        // Reactivar botón para que el usuario pueda reintentar
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        
        alert(error.esValidacion
            ? error.message
            : 'No se pudo enviar el reporte. Verifica tu conexión e inténtalo de nuevo.');
    }
});

// ============================================ //
// 9. MODAL DE ENVÍO EXITOSO                   //
// ============================================ //

const successModal = document.getElementById('success-modal');
const btnVolverInicio = document.getElementById('btn-volver-inicio');
const successVideo = document.getElementById('success-video');

function mostrarModalExito() {
    // Quitar la clase hidden para mostrar el modal
    successModal.classList.remove('hidden');
    
    // Doble requestAnimationFrame para que el navegador registre el estado inicial
    // antes de animar (evita que la transición no se vea)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            successModal.classList.add('modal-active');
        });
    });
    
    // Reproducir el video desde el inicio
    if (successVideo) {
        successVideo.currentTime = 0;
        successVideo.play();
    }
}

function ocultarModalExito() {
    successModal.classList.remove('modal-active');
    successModal.classList.add('modal-exit');
    
    if (successVideo) {
        successVideo.pause();
    }
    
    // Esperar a que termine la transición de salida antes de ocultar
    setTimeout(() => {
        successModal.classList.add('hidden');
        successModal.classList.remove('modal-exit');
    }, 250);
}

// Al terminar el video, detenerlo para que se quede congelado en el último frame
if (successVideo) {
    successVideo.addEventListener('ended', () => {
        successVideo.pause();
    });
}

// Botón "Volver al Inicio" - desvanece pantalla y modal juntos, luego redirige
if (btnVolverInicio) {
    btnVolverInicio.addEventListener('click', () => {
        // Desvanecer la pantalla de reportes
        document.querySelector('main').classList.remove('loaded');
        document.querySelector('main').classList.add('fade-out-back');
        
        // Desvanecer el modal junto con la pantalla
        successModal.classList.remove('modal-active');
        successModal.classList.add('modal-exit');
        
        if (successVideo) {
            successVideo.pause();
        }
        
        // Esperar a que termine la transición de salida (400ms) antes de redirigir
        setTimeout(() => {
            window.location.href = 'principal.html';
        }, 400);
    });
}

// ============================================ //
// 10. BOTÓN VOLVER - Con animación de salida   //
// ============================================ //

backButton.addEventListener('click', () => {
    document.querySelector('main').classList.remove('loaded');
    document.querySelector('main').classList.add('fade-out-back');
    
    setTimeout(() => {
        window.location.href = 'principal.html';
    }, 400);
});

// ============================================ //
// 11. INICIALIZACIÓN                           //
// ============================================ //

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Reportes - Iniciado correctamente');
    initCarousel();
    initEntranceTransition();
    console.log('📍 Departamentos disponibles:', Object.keys(data).length);
});

console.log('✅ Reportes - Script cargado correctamente');

// ============================================ //
// 12. TRANSICIÓN DE ENTRADA                    //
// ============================================ //

function initEntranceTransition() {
    requestAnimationFrame(() => {
        document.querySelector('main').classList.add('loaded');
    });
}