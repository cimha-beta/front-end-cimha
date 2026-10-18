// ============================================ //
// IR-A-CONSULTA.JS - JAVASCRIPT                //
// ============================================ //

// Selección del tipo de pronóstico.

// ============================================ //
// 1. ESPERAR A QUE EL DOM ESTÉ LISTO          //
// ============================================ //

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Ir a Consulta - Iniciado correctamente');
    initButtonInteractions();
    initEntranceTransition();
    initBackButton();
});

// ============================================ //
// 2. INTERACCIONES DE BOTONES                  //
// ============================================ //

function initButtonInteractions() {
    // Seleccionar todos los botones
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        // Efecto táctil para móviles
        button.addEventListener('touchstart', () => {
            button.style.opacity = '0.7';
            button.style.transition = 'opacity 0.15s ease';
        });
        
        button.addEventListener('touchend', () => {
            button.style.opacity = '1';
        });
        
        button.addEventListener('touchcancel', () => {
            button.style.opacity = '1';
        });
        
        // Efecto hover para desktop
        button.addEventListener('mouseenter', () => {
            if (!button.disabled) {
                button.style.transform = 'scale(1.02)';
                button.style.transition = 'transform 0.2s ease';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
    });
}

// ============================================ //
// 3. TRANSICIÓN DE ENTRADA                     //
// ============================================ //

function initEntranceTransition() {
    requestAnimationFrame(() => {
        document.querySelector('main').classList.add('loaded');
    });
}

// ============================================ //
// 4. FUNCIONES DE REDIRECCIÓN                  //
// ============================================ //

// Navega a la pantalla de carga del pronóstico.
function irAConsulta() {
    document.querySelector('main').classList.remove('loaded');
    document.querySelector('main').classList.add('fade-out-back');
    
    setTimeout(() => {
        window.location.href = 'carga-pronostico.html';
    }, 400);
}

// Vuelve a la pantalla principal.
function volver() {
    document.querySelector('main').classList.remove('loaded');
    document.querySelector('main').classList.add('fade-out-back');
    
    setTimeout(() => {
        window.location.href = 'principal.html';
    }, 400);
}

// Normaliza el tipo de pronóstico al formato que espera el backend.
function normalizarTipoPronostico(valor) {
    if (!valor) return 'hoy';

    const texto = String(valor)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (texto === 'hoy') return 'hoy';
    if (texto === 'manana') return 'mañana';
    if (texto === 'semana') return 'semana';
    return 'hoy';
}

function getFechaColombiaISO() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const map = {};
    parts.forEach(part => {
        if (part.type !== 'literal') {
            map[part.type] = part.value;
        }
    });

    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}-05:00`;
}

function enviarConsulta(tipoPronostico) {
    // Leer lo que guardó consulta-geografica.html
    const ubicacion = JSON.parse(localStorage.getItem('selected_location') || '{}');
    const tipoNormalizado = normalizarTipoPronostico(tipoPronostico);

    const payload = {
        departamento: ubicacion.dept || null,
        municipio: ubicacion.muni || null,
        consulta: tipoNormalizado,
        fecha: getFechaColombiaISO()
    };

    console.log('🗒 Consulta preparada:', payload);

    // Guardamos el tipo antes de navegar para que la redirección final no dependa del backend.
    sessionStorage.setItem('tipoPronostico', tipoNormalizado);

    // Guarda el payload para que la pantalla de carga envíe el POST al backend.
    sessionStorage.setItem('consultaPendiente', JSON.stringify(payload));

    // Inicia la carga sin esperar la respuesta del servidor.
    window.location.href = 'carga-pronostico.html';
}

// ============================================ //
// 5. FUNCIONES DE UTILIDAD                     //
// ============================================ //

// Registra en consola la tarjeta seleccionada.
function registrarClick(tarjeta) {
    console.log('📱 Tarjeta seleccionada:', tarjeta);
}

console.log('✅ Ir a Consulta - Script cargado correctamente');

// ============================================ //
// 6. BOTÓN DE RETROCESO - Con animación de salida //
// ============================================ //

function initBackButton() {
    const backButton = document.getElementById('back-button');
    
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('main').classList.remove('loaded');
            document.querySelector('main').classList.add('fade-out-back');
            
            setTimeout(() => {
                window.location.href = 'principal.html';
            }, 400);
        });
    }
}
