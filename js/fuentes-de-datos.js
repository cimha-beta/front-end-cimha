// ============================================ //
// FUENTES-DE-DATOS.JS - JAVASCRIPT             //
// ============================================ //

/**
 * CIMHA - Fuentes de datos
 * Información sobre fuentes climáticas e hidrológicas
 */

// ============================================ //
// 1. ESPERAR A QUE EL DOM ESTÉ LISTO          //
// ============================================ //

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Fuentes de datos - Pantalla cargada');
    
    // Aplicar transición de entrada
    aplicarTransicionEntrada();
    
    // Inicializar interacciones
    initInteracciones();
});

// ============================================ //
// 2. TRANSICIÓN DE ENTRADA                     //
// ============================================ //

function aplicarTransicionEntrada() {
    const main = document.querySelector('main');
    
    requestAnimationFrame(() => {
        main.classList.add('loaded');
    });
}

// ============================================ //
// 3. INTERACCIONES                             //
// ============================================ //

function initInteracciones() {
    // Botón Volver
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            navegarConTransicion('principal.html');
        });
    }
    
    // Botón "Ver fuentes climáticas"
    const btnClimaticas = document.getElementById('btn-climaticas');
    if (btnClimaticas) {
        btnClimaticas.addEventListener('click', function() {
            console.log('📊 Ver fuentes climáticas');
            // Abrir enlace externo o redirigir
            // window.open('https://...', '_blank');
        });
    }
    
    // Botón "Ver fuentes hidrológicas"
    const btnHidrologicas = document.getElementById('btn-hidrologicas');
    if (btnHidrologicas) {
        btnHidrologicas.addEventListener('click', function() {
            console.log('🌊 Ver fuentes hidrológicas');
            // Abrir enlace externo o redirigir
            // window.open('https://...', '_blank');
        });
    }
    
    // Navegación inferior
    const navInicio = document.getElementById('nav-inicio');
    if (navInicio) {
        navInicio.addEventListener('click', function() {
            navegarConTransicion('principal.html');
        });
    }
    
    const navMapa = document.getElementById('nav-mapa');
    if (navMapa) {
        navMapa.addEventListener('click', function() {
            console.log('🗺️ Ir a Mapa');
            // navegarConTransicion('mapa.html');
        });
    }
    
    const navDatos = document.getElementById('nav-datos');
    if (navDatos) {
        navDatos.addEventListener('click', function() {
            console.log('📊 Ya estás en Datos');
        });
    }
    
    const navAjustes = document.getElementById('nav-ajustes');
    if (navAjustes) {
        navAjustes.addEventListener('click', function() {
            console.log('⚙️ Ir a Ajustes');
            // navegarConTransicion('ajustes.html');
        });
    }
    
    // Efecto de escala en todos los botones
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mousedown', () => {
            if (!button.classList.contains('active:scale-95') && !button.classList.contains('active:scale-90')) {
                button.style.transform = 'scale(0.95)';
            }
        });
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
    });
}

// ============================================ //
// 4. FUNCIÓN DE REDIRECCIÓN CON TRANSICIÓN    //
// ============================================ //

function navegarConTransicion(destino) {
    const main = document.querySelector('main');
    main.classList.remove('loaded');
    main.classList.add('fade-out-back');
    
    setTimeout(() => {
        window.location.href = destino;
    }, 400);
}

console.log('✅ Fuentes de datos - Script cargado correctamente');
