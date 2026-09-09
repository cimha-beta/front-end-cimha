// ============================================ //
// INDEX.JS - JAVASCRIPT PRINCIPAL              //
// ============================================ //

/**
 * CIMHA - Sistema de Precisión Hidrológica
 * Pantalla de bienvenida con logo
 */

// ============================================ //
// 1. ESPERAR A QUE EL DOM ESTÉ LISTO          //
// ============================================ //

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 CIMHA - Sistema iniciado correctamente');
    
    // Iniciar secuencia de bienvenida
    iniciarBienvenida();
});

// ============================================ //
// 2. SECUENCIA DE BIENVENIDA CON LOGO         //
// ============================================ //

function iniciarBienvenida() {
    const logoContainer = document.getElementById('logo-container');
    
    if (!logoContainer) {
        console.error('❌ No se encontró #logo-container');
        // Si no hay logo, redirigir directamente
        window.location.href = 'consulta-geografica.html';
        return;
    }
    
    console.log('🎬 Iniciando secuencia de bienvenida...');
    
    // PASO 1: Mostrar logo con animación de entrada
    logoContainer.classList.remove('opacity-0');
    logoContainer.classList.add('animate-fade-in');
    
    // PASO 2: Esperar 2 segundos (logo visible)
    setTimeout(() => {
        console.log('⏰ 2 segundos completados, ocultando logo...');
        
        // PASO 3: Ocultar logo con animación de salida
        logoContainer.classList.remove('animate-fade-in');
        logoContainer.classList.add('animate-fade-out');
        
        // PASO 4: Esperar a que termine la animación de salida (0.5s)
        setTimeout(() => {
            console.log('🔄 Redirigiendo a consulta-geografica.html...');
            
            // PASO 5: Redirigir a la siguiente pantalla
            window.location.href = 'consulta-geografica.html';
            
        }, 500); // 500ms = duración de la animación fade-out
        
    }, 3000); // 3000ms = 3 segundos
}

// ============================================ //
// 3. FUNCIONES DE UTILIDAD (opcionales)       //
// ============================================ //

/**
 * Función para redirigir manualmente (si se necesita)
 */
function redirigirA(destino) {
    window.location.href = destino;
}

/**
 * Función para obtener el tiempo restante (debug)
 */
function obtenerTiempoRestante(tiempoInicio, duracion) {
    const tiempoActual = Date.now();
    const tiempoTranscurrido = (tiempoActual - tiempoInicio) / 1000;
    return Math.max(0, duracion - tiempoTranscurrido);
}

console.log('✅ CIMHA - Script cargado correctamente');
