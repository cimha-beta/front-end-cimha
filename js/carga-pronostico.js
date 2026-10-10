// ============================================ //
// CARGA-PRONOSTICO.JS                          //
// ============================================ //

// ============================================ //
// 1. CONFIGURACIÓN                             //
// ============================================ //

const BACKEND_URL = 'https://back-end-cimha-production.up.railway.app/webhook/consulta-coordenadas';

const statusSteps = [
    "Validando ubicación",
    "Consultando clima",
    "Ubicando estaciones",
    "Estaciones verificadas",
    "Analizando el río",
    "Contrastando fuentes",
    "Procesando con IA",
    "Generando pronóstico",
    "Pronóstico listo"
];

// Porcentaje por paso (mismo orden que statusSteps)
const porcentajePorPaso = [12, 21, 35, 43, 62, 72, 84, 96, 100];

const totalPasos = statusSteps.length;
const timePerPhase = 1500;

// ============================================ //
// 2. VARIABLES DE ESTADO                       //
// ============================================ //

let currentStep = 0;
let isCancelled = false;
let timeoutId = null;
let consultaPromise = null;

// ============================================ //
// 3. REFERENCIAS A ELEMENTOS DOM               //
// ============================================ //

const cancelButton = document.getElementById('cancel-button');
const cancelModal = document.getElementById('cancel-modal');
const modalOkBtn = document.getElementById('modal-ok-btn');
const cancelVideo = document.getElementById('cancel-video');

const ringBar = document.getElementById('ring-bar');
const stepInfo = document.getElementById('step-info');
const stepCount = document.getElementById('step-count');
const stepName = document.getElementById('step-name');
const stepsList = document.getElementById('steps-list');
const highlightEl = document.getElementById('step-highlight');

if (cancelVideo) {
    cancelVideo.addEventListener('ended', () => cancelVideo.pause());
}

// ============================================ //
// 4. INICIALIZACIÓN                            //
// ============================================ //

document.addEventListener('DOMContentLoaded', function () {
    aplicarTransicionEntrada();
    inicializarOdometro();
    inicializarListaDePasos();
    inicializarAnillo();

    setTimeout(() => {
        iniciarCarga();
    }, 500);

    initInteracciones();
});

function aplicarTransicionEntrada() {
    const main = document.querySelector('main');
    if (main) {
        requestAnimationFrame(() => {
            main.classList.add('loaded');
        });
    }
}

// ============================================ //
// 5. ODÓMETRO DE PORCENTAJE                    //
// ============================================ //

// Cada columna repite 0-9 varias veces para girar en bucle
const REPETICIONES = 5;

let odometerEl = null;
let columnasOdometro = [];

function crearColumnaOdometro() {
    const col = document.createElement('div');
    col.className = 'odometer-col';
    const strip = document.createElement('div');
    strip.className = 'odometer-strip';
    for (let r = 0; r < REPETICIONES; r++) {
        for (let d = 0; d <= 9; d++) {
            const span = document.createElement('span');
            span.textContent = d;
            strip.appendChild(span);
        }
    }
    col.appendChild(strip);
    return { col, strip, pos: 0, timer: null };
}

function asegurarColumnasOdometro(cantidad) {
    while (columnasOdometro.length < cantidad) {
        const nueva = crearColumnaOdometro();
        odometerEl.insertBefore(nueva.col, odometerEl.firstChild);
        columnasOdometro.unshift(nueva);
    }
}

function inicializarOdometro() {
    odometerEl = document.getElementById('odometer');
    if (!odometerEl) return;
    columnasOdometro = [];
    setPorcentajeOdometro(0);
}

// Avanza siempre hacia adelante: ...8, 9, 0, 1, 2...
function avanzarColumna(colObj, digito) {
    const pasos = (digito - (colObj.pos % 10) + 10) % 10;
    if (pasos === 0) return;

    colObj.pos += pasos;
    colObj.strip.style.transform = `translateY(-${colObj.pos}em)`;

    // Reinicio invisible para no salirse de la columna
    clearTimeout(colObj.timer);
    colObj.timer = setTimeout(() => {
        if (colObj.pos >= 30) {
            colObj.pos -= 20;
            colObj.strip.style.transition = 'none';
            colObj.strip.style.transform = `translateY(-${colObj.pos}em)`;
            void colObj.strip.offsetWidth;
            colObj.strip.style.transition = '';
        }
    }, 700);
}

function setPorcentajeOdometro(valor) {
    if (!odometerEl) return;
    const str = String(valor);
    asegurarColumnasOdometro(str.length);

    // Alinear dígitos a la derecha
    const offset = columnasOdometro.length - str.length;

    columnasOdometro.forEach((colObj, i) => {
        const esVisible = i >= offset;
        colObj.col.classList.toggle('active', esVisible);
        if (esVisible) {
            avanzarColumna(colObj, parseInt(str[i - offset], 10));
        }
    });
}

// ============================================ //
// 6. ANILLO DE PROGRESO                        //
// ============================================ //

const RING_LENGTH = 2 * Math.PI * 60; // radio del círculo SVG

function inicializarAnillo() {
    if (!ringBar) return;
    ringBar.style.strokeDasharray = RING_LENGTH;
    ringBar.style.strokeDashoffset = RING_LENGTH;
}

function actualizarAnillo(porcentaje) {
    if (!ringBar) return;
    ringBar.style.strokeDashoffset = RING_LENGTH * (1 - porcentaje / 100);
}

// ============================================ //
// 7. LISTA DE PASOS                            //
// ============================================ //

let rowEls = [];

function inicializarListaDePasos() {
    if (!stepsList) return;

    statusSteps.forEach((nombre, i) => {
        const row = document.createElement('div');
        row.className = 'step';
        row.innerHTML = `
            <span class="step-num">
                <span class="num">${i + 1}</span>
                <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" pathLength="1"></path></svg>
            </span>
            <span class="step-text">${nombre}</span>
            <span class="step-pct">${porcentajePorPaso[i]}%</span>`;
        stepsList.appendChild(row);
        rowEls.push(row);
    });
}

function marcarPaso(index, estado) {
    const row = rowEls[index];
    if (!row) return;
    row.classList.remove('active', 'done');
    row.classList.add(estado);
}

// Resaltado deslizante entre filas
function moverResaltado(index) {
    const row = rowEls[index];
    if (!row || !highlightEl) return;
    highlightEl.style.transform = `translateY(${row.offsetTop}px)`;
    highlightEl.style.opacity = '1';
}

// Fundido cruzado del paso actual
function actualizarEtiqueta(index) {
    if (!stepInfo) return;
    stepInfo.classList.add('swap');

    setTimeout(() => {
        stepCount.textContent = `Paso ${index + 1} De ${totalPasos}`;
        stepName.textContent = statusSteps[index];
        stepInfo.classList.remove('swap');
    }, 250);
}

function activarPaso(index) {
    // Completar paso anterior
    if (index > 0) marcarPaso(index - 1, 'done');

    // El resaltado se desliza primero
    moverResaltado(index);
    setTimeout(() => {
        if (!isCancelled) marcarPaso(index, 'active');
    }, 250);

    actualizarEtiqueta(index);

    // Porcentaje: odómetro y anillo
    const pct = porcentajePorPaso[index] ?? Math.round(((index + 1) / totalPasos) * 100);
    setPorcentajeOdometro(pct);
    actualizarAnillo(pct);
}

function finalizarUltimoPaso() {
    marcarPaso(totalPasos - 1, 'done');
}

// ============================================ //
// 8. CICLO DE CARGA                            //
// ============================================ //

async function iniciarCarga() {
    if (isCancelled) return;

    // Disparar consulta al backend en paralelo
    if (currentStep === 0) {
        consultaPromise = consultarBackendYGuardar();
    }

    if (isCancelled) return;

    if (currentStep < statusSteps.length) {
        activarPaso(currentStep);
        currentStep++;

        if (currentStep < statusSteps.length) {
            timeoutId = setTimeout(iniciarCarga, timePerPhase);
        } else {
            // Esperar respuesta del backend
            if (consultaPromise) {
                try { await consultaPromise; } catch (err) { console.error('❌ Error al obtener los datos:', err); }
            }
            if (isCancelled) return;

            // Redirigir al terminar animación y datos
            setTimeout(() => {
                if (!isCancelled) {
                    finalizarUltimoPaso();
                    setTimeout(() => {
                        if (!isCancelled) {
                            const tipoPronostico = sessionStorage.getItem('tipoPronostico');
                            const pantallaResultado = tipoPronostico === 'mañana'
                                ? 'resultado-manana.html'
                                : 'resultado-del-dia.html';
                            navegarConTransicion(pantallaResultado);
                        }
                    }, 700);
                }
            }, 600);
        }
    }
}

async function consultarBackendYGuardar() {
    // Leer consulta preparada en consulta.js
    const pendiente = sessionStorage.getItem('consultaPendiente');
    if (!pendiente) {
        console.warn('⚠️ No hay consulta pendiente en sessionStorage (consultaPendiente).');
        return null;
    }
    sessionStorage.removeItem('consultaPendiente');

    try {
        const payload = JSON.parse(pendiente);
        console.log('📡 Enviando petición al backend...', payload);

        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Responde { ok: true, reporte: {...} } o el reporte directo
        console.log('✅ DATOS RECIBIDOS DEL BACKEND:', data);

        sessionStorage.setItem('datosPronostico', JSON.stringify(data.reporte || data));
        sessionStorage.setItem('tipoPronostico', payload.consulta || 'hoy');
        return data;
    } catch (err) {
        console.error('❌ Error de red o CORS al conectar con el backend:', err);
        return null;
    }
}

// ============================================ //
// 9. CANCELACIÓN                               //
// ============================================ //

function cancelarProceso() {
    isCancelled = true;
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
    if (cancelModal) {
        cancelModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                cancelModal.classList.add('modal-active');
            });
        });
    }
}

function initInteracciones() {
    if (cancelButton) {
        cancelButton.addEventListener('click', function (e) {
            e.preventDefault();
            cancelarProceso();
        });
    }

    if (modalOkBtn) {
        modalOkBtn.addEventListener('click', function () {
            navegarConTransicion('principal.html');
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (cancelModal && !cancelModal.classList.contains('hidden')) {
                navegarConTransicion('principal.html');
            } else {
                cancelarProceso();
            }
        }
    });
}

// ============================================ //
// 10. NAVEGACIÓN CON TRANSICIÓN                //
// ============================================ //

function navegarConTransicion(destino) {
    const main = document.querySelector('main');
    if (main) {
        main.classList.remove('loaded');
        main.classList.add('fade-out-back');
    }

    if (cancelModal && !cancelModal.classList.contains('hidden')) {
        cancelModal.classList.remove('modal-active');
        cancelModal.classList.add('modal-exit');
    }

    setTimeout(() => {
        window.location.href = destino;
    }, 400);
}