// ============================================ //
// POLITICA-DE-PRIVACIDAD.JS                    //
// ============================================ //

// ============================================ //
// 1. REFERENCIAS A ELEMENTOS DOM               //
// ============================================ //

const main = document.querySelector('main');
const backButton = document.getElementById('back-button');
const supportBtn = document.getElementById('support-btn');
const draftNotice = document.getElementById('draft-notice');
const policyIntro = document.getElementById('policy-intro');
const policyDate = document.getElementById('policy-date');
const policyVersion = document.getElementById('policy-version');
const policySections = document.getElementById('policy-sections');

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
// 3. RENDER DE TEXTO                           //
// ============================================ //

// Crea un párrafo (resalta pendientes)
function crearParrafo(texto) {
    const p = document.createElement('p');
    p.className = 'policy-text';
    if (texto.includes('[PENDIENTE')) p.classList.add('pending');
    p.textContent = texto;
    return p;
}

// Crea una lista con viñetas
function crearLista(items) {
    const ul = document.createElement('ul');
    ul.className = 'policy-list';
    items.forEach((texto) => {
        const li = document.createElement('li');
        li.textContent = texto;
        ul.appendChild(li);
    });
    return ul;
}

// Crea la tarjeta de una sección
function crearSeccion(seccion) {
    const card = document.createElement('section');
    card.className = 'card';
    card.id = seccion.id;

    const head = document.createElement('div');
    head.className = 'section-head';

    const icon = document.createElement('div');
    icon.className = 'section-icon';
    const symbol = document.createElement('span');
    symbol.className = 'material-symbols-outlined';
    symbol.textContent = seccion.icono || 'description';
    icon.appendChild(symbol);

    const title = document.createElement('h2');
    title.className = 'card-title';
    title.textContent = seccion.titulo;

    head.append(icon, title);
    card.appendChild(head);

    (seccion.parrafos || []).forEach((t) => card.appendChild(crearParrafo(t)));
    if (seccion.items && seccion.items.length) {
        card.appendChild(crearLista(seccion.items));
    }
    return card;
}

// Formatea fecha AAAA-MM-DD
function formatearFecha(iso) {
    if (!iso) return 'Pendiente';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}

// ============================================ //
// 4. PINTAR CONTENIDO                          //
// ============================================ //

function pintarPolitica() {
    const data = POLITICA_PRIVACIDAD;

    draftNotice.hidden = data.publicada;
    policyIntro.textContent = data.introduccion;
    if (data.introduccion.includes('[PENDIENTE')) policyIntro.classList.add('pending');
    policyDate.textContent = formatearFecha(data.ultimaActualizacion);
    policyVersion.textContent = data.version;

    data.secciones.forEach((s) => policySections.appendChild(crearSeccion(s)));
}

// ============================================ //
// 5. EVENT LISTENERS                           //
// ============================================ //

backButton.addEventListener('click', (e) => {
    e.preventDefault();
    navegarConTransicion('acerca-de-nosotros.html');
});

// Soporte: formulario de reportes
supportBtn.addEventListener('click', () => navegarConTransicion('reportes.html'));

// ============================================ //
// 6. INICIALIZACIÓN                            //
// ============================================ //

document.addEventListener('DOMContentLoaded', () => {
    pintarPolitica();
    requestAnimationFrame(() => main.classList.add('loaded'));
});
