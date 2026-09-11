document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
    document.getElementById('salir-pronostico')?.addEventListener('click', () => {
        window.location.href = 'principal.html';
    });

    cargarDatosManana();
});

function cargarDatosManana() {
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
        establecerTextoConUnidad('velocidad-viento', reporte.clima.velocidad_viento, ' Km/h');
    }

    establecerTexto('interpretacion', reporte.interpretacion || 'Sin información.');
    renderizarEstaciones(reporte.estaciones);
}

function renderizarEstaciones(estaciones) {
    const contenedor = document.getElementById('contenedor-estaciones');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    const cantidad = Number(estaciones?.cantidad || 0);
    if (!cantidad) {
        mostrarMensaje('No hay estaciones disponibles para mañana.');
        return;
    }

    for (let indice = 1; indice <= cantidad; indice += 1) {
        const nombre = estaciones[`estacion_${indice}_nombre`] || `Estación ${indice}`;
        const municipio = estaciones[`estacion_${indice}_municipio`] || 'Sin municipio';
        const nivel = estaciones[`estacion_${indice}_nivel_actual`] ?? 'N/D';
        const precipitacion = estaciones[`estacion_${indice}_precipitacion_actual`] ?? 'N/D';
        const tendencia = estaciones[`estacion_${indice}_tendencia_actual`] || 'Sin dato';
        const prediccion = estaciones[`estacion_${indice}_prediccion_12h`] || 'Sin dato';
        const magnitud = estaciones[`estacion_${indice}_magnitud_prediccion`] || 'Sin dato';

        const tarjeta = document.createElement('article');
        tarjeta.className = 'station-item';
        tarjeta.innerHTML = `
            <div>
                <p class="station-name">${escaparHTML(nombre)}</p>
                <p class="station-location">${escaparHTML(municipio)}</p>
                <div class="station-level">${escaparHTML(nivel)} m</div>
            </div>
            <div class="station-data">
                <span>Precipitación: ${escaparHTML(precipitacion)} mm</span>
                <span class="station-trend">${escaparHTML(tendencia)}</span>
                <span class="station-prediction">12 h: ${escaparHTML(prediccion)}</span>
                <span>Magnitud: ${escaparHTML(magnitud)}</span>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    }
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
}

function escaparHTML(valor) {
    return String(valor)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
