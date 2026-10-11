// ============================================ //
// IR-A-CONSULTA.JS - JAVASCRIPT                //
// ============================================ //

/**
 * CIMHA - Ir a Consulta
 * Selección de tipo de pronóstico
 */

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

/**
 * Redirige a la pantalla de consulta
 */
function irAConsulta() {
    document.querySelector('main').classList.remove('loaded');
    document.querySelector('main').classList.add('fade-out-back');
    
    setTimeout(() => {
        window.location.href = 'carga-pronostico.html';
    }, 400);
}

/**
 * Redirige a la pantalla anterior
 */
function volver() {
    document.querySelector('main').classList.remove('loaded');
    document.querySelector('main').classList.add('fade-out-back');
    
    setTimeout(() => {
        window.location.href = 'principal.html';
    }, 400);
}

/**
 * Combina la ubicación guardada con el tipo de pronóstico elegido
 * y envía todo junto al webhook
 */
function enviarConsulta(tipoPronostico) {
    // Leer lo que guardó consulta-geografica.html
    const ubicacion = JSON.parse(localStorage.getItem('selected_location') || '{}');

    const payload = {
        departamento: ubicacion.dept || null,
        municipio: ubicacion.muni || null,
        consulta: tipoPronostico,
        fecha: new Date().toISOString()
    };

    console.log('🗒 Consulta preparada:', payload);

    // Deja el payload listo en sessionStorage para que carga-pronostico.html
    // realice el POST al backend (esto es lo que permite redirigir al instante).
    sessionStorage.setItem('consultaPendiente', JSON.stringify(payload));

    // ✅ Redirige a la pantalla de carga INMEDIATAMENTE, sin esperar al servidor.
    // El backend lo consulta carga-pronostico.js al cargar, en paralelo con la animación.
    window.location.href = 'carga-pronostico.html';
}

// ============================================ //
// 5. FUNCIONES DE UTILIDAD                     //
// ============================================ //

/**
 * Función para registrar clicks en tarjetas
 */
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
