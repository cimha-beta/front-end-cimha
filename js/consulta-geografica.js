// ============================================ //
// CONSULTA-GEOGRAFICA.JS                       //
// ============================================ //

// ============================================ //
// 1. DATOS DE DEPARTAMENTOS Y MUNICIPIOS       //
// ============================================ //

const data = {
    'Córdoba': ['Montería', 'Cereté', 'Lorica', 'Ciénaga de Oro']
};

// ============================================ //
// 2. VARIABLES DE ESTADO                       //
// ============================================ //

let selectedDept = null;
let selectedMuni = null;
let activeSelectionType = null;

// ============================================ //
// 3. REFERENCIAS A ELEMENTOS DOM               //
// ============================================ //

const deptTrigger = document.getElementById('dept-trigger');
const deptLabel = document.getElementById('dept-label');
const deptIcon = document.getElementById('dept-icon');
const deptList = document.getElementById('dept-list');

const muniTrigger = document.getElementById('muni-trigger');
const muniLabel = document.getElementById('muni-label');
const muniIcon = document.getElementById('muni-icon');
const muniList = document.getElementById('muni-list');

const submitBtn = document.getElementById('submit-btn');
const main = document.querySelector('main');

// ============================================ //
// 4. EVENT LISTENERS                           //
// ============================================ //

deptTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown('dept');
});

muniTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown('muni');
});

// Cerrar al hacer clic fuera
document.addEventListener('click', closeDropdowns);

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdowns();
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

    const { trigger, icon, list } = getParts(type);
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
        const { trigger, icon, list } = getParts(type);
        trigger.classList.remove('open');
        list.classList.remove('open');
        
    });
    activeSelectionType = null;
}

// ============================================ //
// 6. SELECCIÓN DE OPCIONES                     //
// ============================================ //

function selectOption(type, val) {
    if (type === 'dept') {
        if (selectedDept !== val) {
            selectedDept = val;
            deptLabel.textContent = val;

            // Reiniciar municipio
            selectedMuni = null;
            muniLabel.textContent = 'Selecciona un municipio';

            // Habilitar municipio
            muniTrigger.disabled = false;
        }
    } else {
        selectedMuni = val;
        muniLabel.textContent = val;
    }

    validateForm();
    closeDropdowns();
}

// ============================================ //
// 7. VALIDACIÓN DEL FORMULARIO                 //
// ============================================ //

function validateForm() {
    submitBtn.disabled = !(selectedDept && selectedMuni);
}

// ============================================ //
// 8. ENVÍO DEL FORMULARIO                      //
// ============================================ //

submitBtn.addEventListener('click', () => {
    if (submitBtn.disabled) return;

    // Guardar ubicación
    localStorage.setItem('selected_location', JSON.stringify({
        dept: selectedDept,
        muni: selectedMuni
    }));

    // Salida con fade y redirección
    main.classList.remove('loaded');
    main.classList.add('fade-out-back');

    setTimeout(() => {
        window.location.href = 'principal.html';
    }, 400); // coincide con la transición del CSS
});

// ============================================ //
// 9. INICIALIZACIÓN                            //
// ============================================ //

document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => main.classList.add('loaded'));
});