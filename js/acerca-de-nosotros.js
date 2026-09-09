// ============================================ //
// ACERCA-DE-NOSOTROS.JS - JAVASCRIPT           //
// ============================================ //

/**
 * CIMHA - Acerca de nosotros
 * Información de la organización y equipo
 */

// ============================================ //
// 1. ESPERAR A QUE EL DOM ESTÉ LISTO          //
// ============================================ //

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Acerca de nosotros - Pantalla cargada');
    
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
    const backButton = document.getElementById('back-button');
    
    // Botón volver con transición
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const main = document.querySelector('main');
            main.classList.remove('loaded');
            main.classList.add('fade-out-back');
            
            setTimeout(() => {
                window.location.href = 'principal.html';
            }, 400);
        });
    }
    
    // Efecto hover en tarjetas de valores (también manejado por CSS)
    // Esta es una mejora adicional con JavaScript
    const valueCards = document.querySelectorAll('.value-card');
    valueCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // CSS ya maneja el hover, pero podemos agregar efectos adicionales
        });
    });
}

// ============================================ //
// CARRUSEL AUTOMÁTICO DE VALORES (LOOP INFINITO) //
// ============================================ //

function initValuesCarousel() {
    const track = document.getElementById('values-track');
    const dotsContainer = document.getElementById('values-dots');
    const slides = track.children;
    const realSlidesCount = slides.length - 1; // sin contar el clon
    let currentIndex = 0;
    let isTransitioning = false;

    // Crear los puntos indicadores (solo para las cards reales, no el clon)
    for (let i = 0; i < realSlidesCount; i++) {
        const dot = document.createElement('div');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }

    function updateDots(index) {
        Array.from(dotsContainer.children).forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    function goToSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex = index;
        track.style.transition = 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots(currentIndex);
    }

    function nextSlide() {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex++;
        track.style.transition = 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        // Si llegamos al clon (última posición), actualizamos el punto al primero
        if (currentIndex === realSlidesCount) {
            updateDots(0);
        } else {
            updateDots(currentIndex);
        }
    }

    // Cuando termina la transición, si estamos en el clon, saltamos sin animar al real
    track.addEventListener('transitionend', () => {
        isTransitioning = false;
        if (currentIndex === realSlidesCount) {
            track.style.transition = 'none';
            currentIndex = 0;
            track.style.transform = `translateX(0%)`;
        }
    });

    // Avanza automáticamente cada 5 segundos
    setInterval(nextSlide, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    initValuesCarousel();
});

// ============================================ //
// 5. FUNCIÓN DE REDIRECCIÓN CON TRANSICIÓN    //
// ============================================ //

function navegarConTransicion(destino) {
    const main = document.querySelector('main');
    main.classList.remove('loaded');
    main.classList.add('fade-out-back');
    
    setTimeout(() => {
        window.location.href = destino;
    }, 400);
}

console.log('✅ Acerca de nosotros - Script cargado correctamente');
