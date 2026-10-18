document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
    document.getElementById('salir-pronostico')?.addEventListener('click', () => {
        window.location.href = 'principal.html';
    });

    cargarDatosManana();
});

function cargarDatosManana() {
    mostrarMensaje('Cargando interpretación...');
    const datosGuardados = sessionStorage.getItem('datosPronostico');
    if (!datosGuardados) {
        mostrarMensaje('No hay datos de mañana disponibles. Realiza una nueva consulta.');
        return;
    }

    try {
        const datos = JSON.parse(datosGuardados);
        const reporte = Array.isArray(datos) ? datos[0] : datos;
        pintarReporte(reporte);
    } catch (error) {
        console.error('No se pudo leer el pronóstico de mañana:', error);
        mostrarMensaje('No se pudo cargar el pronóstico de mañana.');
    }
}

function pintarReporte(reporte) {
    if (!reporte) return;

    establecerTexto('fecha', reporte.fecha);
    establecerTexto('hora', reporte.hora);

    if (reporte.ubicacion) {
        establecerTexto('ubicacion', `${reporte.ubicacion.municipio}, ${reporte.ubicacion.departamento}`);
    }

    if (reporte.clima) {
        establecerTexto('estado-cielo', reporte.clima.estado_cielo);
        establecerTextoConUnidad('temp-max', reporte.clima.temperatura_maxima, '°');
        establecerTextoConUnidad('temp-min', reporte.clima.temperatura_minima, '°');
        establecerTexto('sensacion-termica', reporte.clima.posible_sensacion_termica);
        establecerTextoConUnidad('prob-lluvia', reporte.clima.probabilidad_lluvia, '%');
        establecerTexto('velocidad-viento', reporte.clima.velocidad_viento);
    }

    establecerTexto(
        'interpretacion',
        reporte.clima?.interpretacion ?? reporte.interpretacion ?? 'Sin información.'
    );
    const interpretacionEstaciones = reporte.estaciones?.interpretacion;
    establecerTexto('interpretacion-estaciones', interpretacionEstaciones || 'Sin información.');
    const tarjetaEstaciones = document.getElementById('interpretacion-estaciones-card');
    if (tarjetaEstaciones) tarjetaEstaciones.hidden = !interpretacionEstaciones;
    renderizarRecomendaciones(reporte.clima?.recomendaciones);
    renderizarEstaciones(reporte.estaciones);
}

function renderizarRecomendaciones(listaRecomendaciones) {
    const bloque = document.getElementById('recomendaciones-bloque');
    const lista = document.getElementById('recomendaciones-lista');
    if (!bloque || !lista) return;

    const elementos = Array.isArray(listaRecomendaciones) ? listaRecomendaciones : [];
    lista.replaceChildren(...elementos.map(recomendacion => {
        const elemento = document.createElement('li');
        elemento.textContent = recomendacion ?? '';
        return elemento;
    }));
    bloque.hidden = elementos.length === 0;
}

function renderizarEstaciones(estaciones) {
    const contenedor = document.getElementById('contenedor-estaciones');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    const cantidad = Number(estaciones?.cantidad || 0);
    if (!cantidad) {
        contenedor.innerHTML = '<p class="empty-state">No hay estaciones disponibles para mañana.</p>';
        return;
    }

    // Íconos de tendencia (SVG)
    const ICONOS = {
        aumento: '<path d="M6 15l6-7 6 7"></path>',
        descenso: '<path d="M6 9l6 7 6-7"></path>',
        estable: '<path d="M6 12h12"></path>'
    };

    for (let indice = 1; indice <= cantidad; indice += 1) {
        const nombre = estaciones[`estacion_${indice}_nombre`] || `Estación ${indice}`;
        const municipio = estaciones[`estacion_${indice}_municipio`] || '';
        const nivel = estaciones[`estacion_${indice}_nivel_actual`] ?? 'N/D';
        const tendencia = estaciones[`estacion_${indice}_tendencia_actual`] || 'Sin dato';
        const prediccion = estaciones[`estacion_${indice}_prediccion_12h`];
        const magnitud = estaciones[`estacion_${indice}_magnitud_prediccion`];

        const { estado, etiqueta } = clasificarTendencia(tendencia);

        // Nombre de estación solo si es distinto al municipio
        const subtitulo = (municipio && nombre !== municipio)
            ? `<p class="station-sub">${escaparHTML(nombre)}</p>`
            : '';

        const tarjeta = document.createElement('article');
        tarjeta.className = 'station-item';
        tarjeta.innerHTML = `
            <div class="station-main">
                <h3 class="station-name">${escaparHTML(municipio || nombre)}</h3>
                ${subtitulo}
                <span class="station-level ${estado}">${escaparHTML(nivel)} m</span>
                <span class="station-trend ${estado}">
                    <svg viewBox="0 0 24 24">${ICONOS[estado]}</svg>${escaparHTML(etiqueta)}
                </span>
            </div>
            <div class="station-forecast">
                <span class="forecast-label">Predicción 12 h</span>
                <strong class="forecast-value">${escaparHTML(textoPrediccion(prediccion, magnitud))}</strong>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    }
}

// Estado según la tendencia actual
function clasificarTendencia(tendencia) {
    const t = String(tendencia).toLowerCase();

    if (t.includes('ascenso') || t.includes('aumento')) {
        return { estado: 'aumento', etiqueta: 'En aumento' };
    }
    if (t.includes('descenso') || t.includes('disminución')) {
        return { estado: 'descenso', etiqueta: 'En descenso' };
    }
    if (t.includes('estable') || t.includes('sin cambio')) {
        return { estado: 'estable', etiqueta: 'Estable' };
    }
    // Sin dato reconocido: estilo neutro con el texto original
    return { estado: 'estable', etiqueta: tendencia };
}

// Predicción y magnitud en una sola frase (ej.: "Descenso leve")
function textoPrediccion(prediccion, magnitud) {
    const vacio = (v) => !v || ['sin dato', 'n/d', 'ninguna', 'ninguno', '-']
        .includes(String(v).trim().toLowerCase());

    if (vacio(prediccion)) return 'Sin dato';
    if (vacio(magnitud)) return String(prediccion);

    const base = String(prediccion);
    const extra = String(magnitud).trim().toLowerCase();
    return base.toLowerCase().includes(extra) ? base : `${base} ${extra}`;
}

function establecerTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor ?? '--';
}

function establecerTextoConUnidad(id, valor, unidad) {
    establecerTexto(id, valor === null || valor === undefined ? '--' : `${valor}${unidad}`);
}

function mostrarMensaje(mensaje) {
    const contenedor = document.getElementById('contenedor-estaciones');
    if (contenedor) contenedor.innerHTML = `<p class="empty-state">${escaparHTML(mensaje)}</p>`;
    establecerTexto('interpretacion', mensaje);
    establecerTexto('interpretacion-estaciones', mensaje);
    const tarjetaEstaciones = document.getElementById('interpretacion-estaciones-card');
    if (tarjetaEstaciones) tarjetaEstaciones.hidden = true;
    renderizarRecomendaciones([]);
}

function escaparHTML(valor) {
    return String(valor)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}