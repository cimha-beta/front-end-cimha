// ============================================ //
// PRINCIPAL.JS - JAVASCRIPT                    //
// ============================================ //

/**
 * CIMHA - Pantalla Principal
 * Interacciones y funcionalidades
 */

// ============================================ //
// 1. ESPERAR A QUE EL DOM ESTÉ LISTO          //
// ============================================ //

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Pantalla Principal - Iniciada correctamente');
    initCardInteractions();
    initEntranceTransition();
});

// ============================================ //
// 2. FUNCIÓN DE TRANSICIÓN SUAVE              //
// ============================================ //

function navegarConTransicion(destino, tiempo = 400) {
    const main = document.querySelector('main');
    
    // Agregar clase de fade-out
    main.classList.remove('loaded');
    main.classList.add('fade-out-back');
    
    // Esperar a que termine la animación y redirigir
    setTimeout(() => {
        window.location.href = destino;
    }, tiempo);
}

// ============================================ //
// 3. INTERACCIÓN DE TARJETAS                  //
// ============================================ //

function initCardInteractions() {
    const cards = document.querySelectorAll('.card-item');
    
    cards.forEach(card => {
        // Efecto al presionar
        card.addEventListener('mousedown', () => {
            card.style.transform = 'scale(0.97)';
            card.style.transition = 'transform 0.1s ease-out';
        });
        
        card.addEventListener('mouseup', () => {
            card.style.transform = 'scale(1)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
        });
        
        // Efecto táctil
        card.addEventListener('touchstart', () => {
            card.style.transform = 'scale(0.97)';
            card.style.transition = 'transform 0.1s ease-out';
        });
        
        card.addEventListener('touchend', () => {
            card.style.transform = 'scale(1)';
        });
        
        // ✅ Click con transición suave
        card.addEventListener('click', function(e) {
            if (!e.target.closest('a')) {
                const title = this.querySelector('h3')?.textContent || 'Tarjeta';
                console.log('📱 Tarjeta seleccionada:', title);
                
                // ✅ Redirección con transición suave
                if (title.includes('Reportes')) {
                    navegarConTransicion('reportes.html');
                } else if (title.includes('Acerca')) {
                    navegarConTransicion('acerca-de-nosotros.html');
                } else if (title.includes('Fuentes')) {
                    navegarConTransicion('fuentes-de-datos.html');
                }
            }
        });
    });
}

function initEntranceTransition() {
    requestAnimationFrame(() => {
        document.querySelector('main').classList.add('loaded');
    });
}

console.log('✅ Pantalla Principal - Script cargado correctamente');
