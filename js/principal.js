// ============================================ //
// PRINCIPAL.JS - JAVASCRIPT                    //
// ============================================ //

/**
 * CIMHA - Pantalla Principal
 * Interacciones y funcionalidades
 */

'use strict';

// ============================================ //
// 1. CONSTANTES Y CONFIGURACIÓN               //
// ============================================ //

const CONFIG = {
    TIEMPO_TRANSICION: 400,
    RUTAS: {
        reportes: 'reportes.html',
        acerca: 'acerca-de-nosotros.html',
        fuentes: 'fuentes-de-datos.html'
    },
    SELECTORES: {
        main: 'main',
        cards: '.card-item',
        tituloCard: 'h3'
    }
};

// ============================================ //
// 2. UTILIDADES                               //
// ============================================ //

/**
 * Navega a un destino con una transición suave de salida.
 * @param {string} destino - URL o archivo de destino.
 * @param {number} tiempo - Duración de la animación en ms.
 */
function navegarConTransicion(destino, tiempo = CONFIG.TIEMPO_TRANSICION) {
    const main = document.querySelector(CONFIG.SELECTORES.main);
    if (!main) return;

    main.classList.remove('loaded');
    main.classList.add('fade-out-back');

    setTimeout(() => {
        window.location.href = destino;
    }, tiempo);
}

/**
 * Determina la ruta de destino según el título de la tarjeta.
 * @param {string} titulo - Texto del título de la tarjeta.
 * @returns {string|null} Ruta destino o null si no coincide.
 */
function obtenerRutaPorTitulo(titulo) {
    const t = titulo.toLowerCase();
    if (t.includes('reportes')) return CONFIG.RUTAS.reportes;
    if (t.includes('acerca'))   return CONFIG.RUTAS.acerca;
    if (t.includes('fuentes'))  return CONFIG.RUTAS.fuentes;
    return null;
}

// ============================================ //
// 3. INTERACCIÓN DE TARJETAS                  //
// ============================================ //

function initCardInteractions() {
    const cards = document.querySelectorAll(CONFIG.SELECTORES.cards);

    cards.forEach(card => {
        // --- Efecto visual al presionar ---
        const activarScale = () => {
            card.style.transform = 'scale(0.97)';
            card.style.transition = 'transform 0.1s ease-out';
        };
        const restaurarScale = () => {
            card.style.transform = 'scale(1)';
        };

        card.addEventListener('mousedown', activarScale);
        card.addEventListener('mouseup', restaurarScale);
        card.addEventListener('mouseleave', restaurarScale);

        card.addEventListener('touchstart', activarScale, { passive: true });
        card.addEventListener('touchend', restaurarScale);

        // --- Click con transición suave ---
        card.addEventListener('click', function (e) {
            // Si el click fue sobre un enlace, dejamos que el navegador lo maneje
            if (e.target.closest('a')) return;

            const titulo = this.querySelector(CONFIG.SELECTORES.tituloCard)?.textContent || 'Tarjeta';
            console.log('📱 Tarjeta seleccionada:', titulo.toLowerCase());

            const destino = obtenerRutaPorTitulo(titulo);
            if (destino) {
                navegarConTransicion(destino);
            } else {
                console.warn('⚠️ No hay ruta definida para:', titulo);
            }
        });
    });
}

// ============================================ //
// 4. TRANSICIÓN DE ENTRADA                    //
// ============================================ //

function initEntranceTransition() {
    requestAnimationFrame(() => {
        const main = document.querySelector(CONFIG.SELECTORES.main);
        if (main) main.classList.add('loaded');
    });
}

// ============================================ //
// 5. INICIALIZACIÓN                           //
// ============================================ //

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Pantalla Principal - Iniciada correctamente');
    initCardInteractions();
    initEntranceTransition();
});

console.log('✅ Pantalla Principal - Script cargado correctamente');