// ============================================ //
// ACERCA-DE-NOSOTROS.JS                        //
// ============================================ //

// ============================================ //
// 1. REFERENCIAS A ELEMENTOS DOM               //
// ============================================ //

const main = document.querySelector('main');
const backButton = document.getElementById('back-button');
const supportBtn = document.getElementById('support-btn');
const privacyBtn = document.getElementById('privacy-btn');

// ============================================ //
// 2. NAVEGACIÓN CON TRANSICIÓN                 //
// ============================================ //

function navegarConTransicion(destino) {
    main.classList.remove('loaded');
    main.classList.add('fade-out-back');

    setTimeout(() => {
        window.location.href = destino;
    }, 400);
}

// ============================================ //
// 3. EVENT LISTENERS                           //
// ============================================ //

backButton.addEventListener('click', (e) => {
    e.preventDefault();
    navegarConTransicion('principal.html');
});

// Soporte: formulario de reportes
supportBtn.addEventListener('click', () => navegarConTransicion('reportes.html'));

// Política de privacidad
privacyBtn.addEventListener('click', () => navegarConTransicion('politica-privacidad.html'));

// ============================================ //
// 4. INICIALIZACIÓN                            //
// ============================================ //

document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => main.classList.add('loaded'));
});