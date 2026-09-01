(async function(){
/* 👇 TODOS TUS IDs CARGADOS 👇 */
const ids=[55853, 55901, 55933, 55854, 55902, 55934, 55855, 55903, 55935, 55856, 55904, 55936, 55857, 55905, 55937, 55858, 55906, 55938, 55980, 55859, 55907];
const coloresPastel=['#ffffff', '#fcfcfc']; 
// 🛑 RESGUARDO DE RED: Función para pausar la ejecución de peticiones
const esperar = ms => new Promise(res => setTimeout(res, ms));
// 🛑 RESGUARDO DE SISTEMA: Fetch con protección contra caídas de red, tiempo límite y control de tasa
async function fetchSeguro(url, maxReintentos = 3) {
    for (let i = 0; i < maxReintentos; i++) {
        try {
            let controller = new AbortController();
            let timeout = setTimeout(() => controller.abort(), 12000); // Límite de tiempo por consulta (12s)
            let r = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            
            if (r.ok) return r;
            if (r.status === 429) await esperar(3000); // Pausa larga si la plataforma reporta sobrecarga
        } catch (error) {
            if (i === maxReintentos - 1) return { ok: false, statusText: "Error de red" };
            await esperar(600 * (i + 1)); // Reintento progresivo
        }
    }
    return { ok: false };
}
window.mostrarEstudiantesSinNota = function(datosCodificados) {
    let estudiantes = decodeURIComponent(datosCodificados).split('||');
    let listaHtml = estudiantes.map(e => `<li style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px;">👤 ${e}</li>`).join('');
    let div = document.createElement('div');
    div.id = "modal-estudiantes-faltantes";
    div.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:100000;display:flex;justify-content:center;align-items:center;";
    div.innerHTML = `
        <div style="background:white;padding:25px;border-radius:10px;width:400px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,0.3);font-family:sans-serif;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                <h3 style="margin:0;color:#c0392b;">Estudiantes sin calificar</h3>
                <button onclick="document.getElementById('modal-estudiantes-faltantes').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#7f8c8d;font-weight:bold;">&times;</button>
            </div>
            <div style="overflow-y:auto;flex-grow:1;border:1px solid #ecf0f1;padding:10px;border-radius:6px;background:#f9fbfc;">
                <ul style="list-style:none;padding:0;margin:0;font-size:13px;color:#2c3e50;">${listaHtml}</ul>
            </div>
            <button onclick="document.getElementById('modal-estudiantes-faltantes').remove()" style="margin-top:15px;padding:10px;background:#34495e;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Cerrar Ventana</button>
        </div>
    `;
    document.body.appendChild(div);
};
window.mostrarDashboardModal = function(datosExtraidos, esBusquedaEstudiante) {
    let modalPrev = document.getElementById('modal-dashboard');
    if (modalPrev) modalPrev.remove();
    let totalCursos = datosExtraidos.length;
    let cursosCompletos = 0;
    let cursosNotasFaltantes = 0;
    let cursosForosPendientes = 0;
    let docentesInactivos = 0;
    
    let totalEvaluaciones = 0;
    let evaluacionesCalificadas = 0;
    let totalForosEvaluados = 0;
    let forosAtendidos = 0;
    let ciclosMap = {
        "1er Ciclo": { total: 0, completos: 0, conNotas: 0, conForos: 0 },
        "2do Ciclo": { total: 0, completos: 0, conNotas: 0, conForos: 0 },
        "Semestral": { total: 0, completos: 0, conNotas: 0, conForos: 0 }
    };
    
    let docentesAtrasadosMap = {};
    datosExtraidos.forEach(curso => {
        let ciclo = curso.cicloAsignatura || "Semestral";
        if (!ciclosMap[ciclo]) {
            ciclosMap[ciclo] = { total: 0, completos: 0, conNotas: 0, conForos: 0 };
        }
        ciclosMap[ciclo].total++;
        let tieneNotasFaltantes = false;
        let tieneForoFaltante = false;
        let notasFaltantesTotalCurso = 0;
        let evalPendientesLista = [];
        curso.items.forEach(item => {
            totalEvaluaciones++;
            if (item.faltan === 0) evaluacionesCalificadas++;
            if (item.statusForo !== "No aplica") {
                totalForosEvaluados++;
                if (item.statusForo.includes('✅')) forosAtendidos++;
            }
            if (item.faltan > 0) {
                let pasoPlazo = true;
                if (item.fLimite && new Date() < item.fLimite) pasoPlazo = false;
                if (pasoPlazo) {
                    tieneNotasFaltantes = true;
                    notasFaltantesTotalCurso += item.faltan;
                    evalPendientesLista.push(`${item.colNom} (${item.faltan} sin nota)`);
                }
            }
            if (item.statusForo && item.statusForo.includes('❌ No')) {
                tieneForoFaltante = true;
            }
        });
        let accMin = (curso.pAcceso || "").toLowerCase();
        let esInactivo = false;
        if (/nunca|mes|año/.test(accMin)) esInactivo = true;
        else if (/(día|dia)/.test(accMin)) {
            let nDias = parseInt(accMin.match(/\d+/)?.[0] || 0);
            if (nDias >= 7) esInactivo = true;
        }
        if (esInactivo) docentesInactivos++;
        if (tieneNotasFaltantes) {
            cursosNotasFaltantes++;
            ciclosMap[ciclo].conNotas++;
        }
        if (tieneForoFaltante) {
            cursosForosPendientes++;
            ciclosMap[ciclo].conForos++;
        }
        let esCompleto = !tieneNotasFaltantes && !tieneForoFaltante && !esInactivo;
        if (esCompleto) {
            cursosCompletos++;
            ciclosMap[ciclo].completos++;
        }
        if (tieneNotasFaltantes || tieneForoFaltante || esInactivo) {
            let keyDocente = (curso.pCorreo && curso.pCorreo.includes('@')) ? curso.pCorreo : curso.pNombre;
            if (!docentesAtrasadosMap[keyDocente]) {
                docentesAtrasadosMap[keyDocente] = {
                    nombre: curso.pNombre,
                    correo: curso.pCorreo,
                    acceso: curso.pAcceso,
                    cAcceso: curso.cAcceso,
                    esInactivo: esInactivo,
                    cursos: []
                };
            }
            docentesAtrasadosMap[keyDocente].cursos.push({
                nombreCurso: curso.nombreCurso,
                ciclo: curso.cicloAsignatura,
                notasFaltantes: notasFaltantesTotalCurso,
                evaluaciones: evalPendientesLista,
                faltaForo: tieneForoFaltante,
                celdaAcciones: curso.celdaAcciones
            });
        }
    });
    let pctCumplimiento = totalCursos > 0 ? Math.round((cursosCompletos / totalCursos) * 100) : 0;
    let pctNotasAlDia = totalEvaluaciones > 0 ? Math.round((evaluacionesCalificadas / totalEvaluaciones) * 100) : 100;
    let pctForosAlDia = totalForosEvaluados > 0 ? Math.round((forosAtendidos / totalForosEvaluados) * 100) : 100;
    let docentesAtrasadosArr = Object.values(docentesAtrasadosMap).map(d => {
        let totalNotas = d.cursos.reduce((sum, c) => sum + c.notasFaltantes, 0);
        let totalForos = d.cursos.filter(c => c.faltaForo).length;
        let score = totalNotas + (totalForos * 5) + (d.esInactivo ? 10 : 0);
        return { ...d, totalNotas, totalForos, score };
    }).sort((a, b) => b.score - a.score);
    let htmlCiclos = Object.keys(ciclosMap).map(cicloKey => {
        let cData = ciclosMap[cicloKey];
        if (cData.total === 0) return ''; 
        let pctComp = Math.round((cData.completos / cData.total) * 100);
        return `
            <div style="background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px; padding:15px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong style="font-size:15px; color:#2c3e50;">📌 ${cicloKey}</strong>
                    <span style="font-size:13px; font-weight:bold; color:#27ae60;">${pctComp}% Cumplimiento Global</span>
                </div>
                <div style="background:#e0e0e0; border-radius:6px; height:12px; width:100%; overflow:hidden; margin-bottom:8px;">
                    <div style="background:linear-gradient(90deg, #27ae60, #2ecc71); width:${pctComp}%; height:100%;"></div>
                </div>
                <div style="display:flex; gap:15px; font-size:12px; color:#555; flex-wrap:wrap;">
                    <span>📚 Cursos Auditados: <b>${cData.total}</b></span>
                    <span style="color:#27ae60;">✅ Al día: <b>${cData.completos}</b></span>
                    <span style="color:#e67e22;">⚠️ Faltan Calificaciones: <b>${cData.conNotas}</b></span>
                    <span style="color:#c0392b;">💬 Faltan Moderación Foros: <b>${cData.conForos}</b></span>
                </div>
            </div>
        `;
    }).join('');
    let htmlDocentesAtrasados = docentesAtrasadosArr.length > 0 ? docentesAtrasadosArr.map(doc => {
        let detallesCursos = doc.cursos.map(c => {
            let evalsText = c.evaluaciones.length > 0 ? `<br><small style="color:#e67e22;">• ${c.evaluaciones.join(', ')}</small>` : '';
            let foroText = c.faltaForo ? `<br><small style="color:#c0392b;">• Falta moderar foro</small>` : '';
            return `<b>${c.nombreCurso}</b> <span style="font-size:10px; color:#7f8c8d;">(${c.ciclo})</span>${evalsText}${foroText}`;
        }).join('<hr style="border:0; border-top:1px dashed #eee; margin:5px 0;">');
        return `
            <tr>
                <td style="padding:10px; border:1px solid #ddd; font-weight:bold;">${doc.nombre}<br><small style="color:#7f8c8d; font-weight:normal;">${doc.correo}</small></td>
                <td style="padding:10px; border:1px solid #ddd; color:${doc.cAcceso}; font-weight:bold; text-align:center;">${doc.acceso}</td>
                <td style="padding:10px; border:1px solid #ddd; font-size:11px;">${detallesCursos}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:center; font-weight:bold; color:#c0392b;">${doc.totalNotas}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:center;">${doc.cursos[0]?.celdaAcciones || '-'}</td>
            </tr>
        `;
    }).join('') : `<tr><td colspan="5" style="text-align:center; padding:20px; color:#27ae60; font-weight:bold;">🎉 ¡Sin alertas! Todos los docentes están al día.</td></tr>`;
    let modalDiv = document.createElement('div');
    modalDiv.id = "modal-dashboard";
    modalDiv.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:100000; display:flex; justify-content:center; align-items:center; font-family:sans-serif;";
    
    modalDiv.innerHTML = `
        <div style="background:white; border-radius:12px; width:94%; max-width:1200px; max-height:92vh; display:flex; flex-direction:column; box-shadow:0 15px 35px rgba(0,0,0,0.3); overflow:hidden;">
            <div style="background:linear-gradient(135deg, #2c3e50, #1a252f); color:white; padding:18px 25px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h2 style="margin:0; font-size:20px; font-weight:bold;">📊 Dashboard de Control e Indicadores Académicos</h2>
                    <p style="margin:4px 0 0 0; font-size:12px; opacity:0.8;">Monitoreo analítico global por Ciclo Académico (1er Ciclo, 2do Ciclo y Semestral)</p>
                </div>
                <button onclick="document.getElementById('modal-dashboard').remove()" style="background:#e74c3c; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:13px;">❌ Cerrar</button>
            </div>
            <div style="overflow-y:auto; padding:25px; background:#f4f6f9; flex-grow:1;">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap:15px; margin-bottom:25px;">
                    <div style="background:white; padding:15px; border-radius:10px; border-left:5px solid #2980b9; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <span style="font-size:11px; color:#7f8c8d; font-weight:bold; text-transform:uppercase;">Total Asignaturas</span>
                        <div style="font-size:26px; font-weight:bold; color:#2c3e50; margin-top:5px;">${totalCursos}</div>
                    </div>
                    <div style="background:white; padding:15px; border-radius:10px; border-left:5px solid #27ae60; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <span style="font-size:11px; color:#7f8c8d; font-weight:bold; text-transform:uppercase;">Cursos al Día</span>
                        <div style="font-size:26px; font-weight:bold; color:#27ae60; margin-top:5px;">${cursosCompletos}</div>
                    </div>
                    <div style="background:white; padding:15px; border-radius:10px; border-left:5px solid #e67e22; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <span style="font-size:11px; color:#7f8c8d; font-weight:bold; text-transform:uppercase;">Pendiente Notas</span>
                        <div style="font-size:26px; font-weight:bold; color:#e67e22; margin-top:5px;">${cursosNotasFaltantes}</div>
                    </div>
                    <div style="background:white; padding:15px; border-radius:10px; border-left:5px solid #c0392b; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <span style="font-size:11px; color:#7f8c8d; font-weight:bold; text-transform:uppercase;">Pendiente Foros</span>
                        <div style="font-size:26px; font-weight:bold; color:#c0392b; margin-top:5px;">${cursosForosPendientes}</div>
                    </div>
                    <div style="background:white; padding:15px; border-radius:10px; border-left:5px solid #8e44ad; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <span style="font-size:11px; color:#7f8c8d; font-weight:bold; text-transform:uppercase;">Docentes Inactivos (>=7d)</span>
                        <div style="font-size:26px; font-weight:bold; color:#8e44ad; margin-top:5px;">${docentesInactivos}</div>
                    </div>
                    <div style="background:white; padding:15px; border-radius:10px; border-left:5px solid #16a085; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <span style="font-size:11px; color:#7f8c8d; font-weight:bold; text-transform:uppercase;">% Cumplimiento Total</span>
                        <div style="font-size:26px; font-weight:bold; color:#16a085; margin-top:5px;">${pctCumplimiento}%</div>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px;">
                    <div style="background:white; padding:18px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <h4 style="margin:0 0 10px 0; color:#2c3e50; font-size:14px;">📝 Cobertura Global de Calificaciones</h4>
                        <div style="font-size:22px; font-weight:bold; color:#2980b9; margin-bottom:8px;">${pctNotasAlDia}% de Actividades Evaluadas</div>
                        <div style="background:#e0e0e0; border-radius:6px; height:10px; overflow:hidden;">
                            <div style="background:#2980b9; width:${pctNotasAlDia}%; height:100%;"></div>
                        </div>
                        <p style="font-size:11px; color:#7f8c8d; margin:8px 0 0 0;">${evaluacionesCalificadas} de ${totalEvaluaciones} evaluaciones totales se encuentran 100% calificadas.</p>
                    </div>
                    <div style="background:white; padding:18px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <h4 style="margin:0 0 10px 0; color:#2c3e50; font-size:14px;">💬 Cobertura de Moderación en Foros</h4>
                        <div style="font-size:22px; font-weight:bold; color:#8e44ad; margin-bottom:8px;">${pctForosAlDia}% de Foros Atendidos</div>
                        <div style="background:#e0e0e0; border-radius:6px; height:10px; overflow:hidden;">
                            <div style="background:#8e44ad; width:${pctForosAlDia}%; height:100%;"></div>
                        </div>
                        <p style="font-size:11px; color:#7f8c8d; margin:8px 0 0 0;">${forosAtendidos} de ${totalForosEvaluados} foros de discusión / sala de clase registran respuestas del docente.</p>
                    </div>
                </div>
                <div style="background:white; border-radius:10px; padding:20px; margin-bottom:25px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                    <h3 style="margin:0 0 15px 0; color:#2c3e50; font-size:16px; border-bottom:2px solid #ecf0f1; padding-bottom:8px;">📈 Desglose y Avance por Ciclo Académico</h3>
                    ${htmlCiclos}
                </div>
                <div style="background:white; border-radius:10px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                    <h3 style="margin:0 0 15px 0; color:#2c3e50; font-size:16px; border-bottom:2px solid #ecf0f1; padding-bottom:8px;">🚨 Matriz Prioritaria de Intervención Docente</h3>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:12px;">
                            <thead>
                                <tr style="background:#2c3e50; color:white;">
                                    <th style="padding:10px; text-align:left;">Docente</th>
                                    <th style="padding:10px; text-align:center;">Último Acceso</th>
                                    <th style="padding:10px; text-align:left;">Asignaturas y Pendientes</th>
                                    <th style="padding:10px; text-align:center;">Total Sin Nota</th>
                                    <th style="padding:10px; text-align:center;">Acciones Recomendadas</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${htmlDocentesAtrasados}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalDiv);
};
window.enviarCorreoSeguro = function(correo, asuntoCod, introCod, detallesCod, explicacionCod, despedidaCod) {
    let asunto = decodeURIComponent(asuntoCod);
    let cuerpoTexto = decodeURIComponent(introCod) + decodeURIComponent(detallesCod) + decodeURIComponent(explicacionCod) + decodeURIComponent(despedidaCod);
    
    if ((asunto + cuerpoTexto).length > 1800) {
        cuerpoTexto = decodeURIComponent(introCod) + decodeURIComponent(detallesCod) + decodeURIComponent(despedidaCod);
    }
    let urlMailto = `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpoTexto)}`;
    window.open(urlMailto, '_self');
    
    navigator.clipboard.writeText(`Para: ${correo}\nAsunto: ${asunto}\n\n${cuerpoTexto}`).then(() => {
        console.log("Contenido copiado al portapapeles.");
    }).catch(()=>{});
};
function normalizarTexto(t){
    return t?t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g," ").replace(/\s+/g," ").trim():"";
}
function generarNombreCorto(nom, unidad) {
    let n = nom.toLowerCase();
    if(n.includes("formativa")) return `Act. Formativa U${unidad}`;
    if(n.includes("sumativa")) return `Act. Sumativa U${unidad}`;
    return nom.length > 35 ? nom.substring(0,32) + "..." : nom;
}
function parsearFechaMoodle(texto) {
    if (!texto || /cierre del curso/i.test(texto)) return null;
    let t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    let meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    let match = t.match(/(\d+)\s+de\s+([a-z]+)/);
    if (!match) return null;
    let dia = parseInt(match[1]);
    let nombreMes = match[2];
    let mesIdx = meses.findIndex(m => nombreMes.includes(m) || m.includes(nombreMes));
    if (mesIdx === -1) return null;
    let matchAnio = t.match(/\b(\d{4})\b/);
    let anio = matchAnio ? parseInt(matchAnio[1]) : new Date().getFullYear();
    return new Date(anio, mesIdx, dia);
}
function determinarCicloAsignatura(nombreCurso, arregloUnidades, mapaActividadFechas) {
    let nom = normalizarTexto(nombreCurso);
    if (/\b(semestral|semestre|taller|practica|práctica|seminario|tesis|memoria|20\s*semanas)\b/i.test(nom)) {
        return "Semestral";
    }
    let fechasClave = [];
    if (arregloUnidades && arregloUnidades.length > 0) {
        arregloUnidades.forEach(u => {
            let fIni = parsearFechaMoodle(u.inicio);
            let fFin = parsearFechaMoodle(u.termino);
            if (fIni) fechasClave.push(fIni);
            if (fFin) fechasClave.push(fFin);
        });
    }
    if (mapaActividadFechas) {
        Object.values(mapaActividadFechas).forEach(fObj => {
            if (fObj.apertura) {
                let f = parsearFechaMoodle(fObj.apertura);
                if (f) fechasClave.push(f);
            }
            if (fObj.cierre) {
                let f = parsearFechaMoodle(fObj.cierre);
                if (f) fechasClave.push(f);
            }
        });
    }
    if (fechasClave.length >= 2) {
        fechasClave.sort((a, b) => a - b);
        let primeraFecha = fechasClave[0];
        let ultimaFecha = fechasClave[fechasClave.length - 1];
        let mesInicio = primeraFecha.getMonth(); 
        let mesFin = ultimaFecha.getMonth();     
        if ((mesInicio === 7 || mesInicio === 8) && (mesFin === 0 || mesFin === 1)) return "Semestral";
        if (mesInicio === 7 || mesInicio === 8) return "1er Ciclo";
        if (mesInicio === 10 || mesInicio === 11 || mesInicio === 0) return "2do Ciclo";
    }
    if (fechasClave.length > 0) {
        let mesInicio = fechasClave[0].getMonth(); 
        if (mesInicio === 7 || mesInicio === 8) return "1er Ciclo";
        if (mesInicio >= 10 || mesInicio === 0) return "2do Ciclo";
    }
    return "1er Ciclo";
}
function obtenerNumeroUnidad(nombreColumna) {
    let texto = normalizarTexto(nombreColumna);
    let numeros = texto.match(/\d+/g);
    if (numeros && numeros.length > 0) return parseInt(numeros[0]);
    if (/\bvi\b/.test(texto)) return 6;
    if (/\bv\b/.test(texto)) return 5;
    if (/\biv\b/.test(texto)) return 4;
    if (/\biii\b/.test(texto)) return 3;
    if (/\bii\b/.test(texto)) return 2;
    if (/\bi\b/.test(texto)) return 1;
    return null;
}
function asignarUnidad(nom, idxCol, totalUnidades, actId, mapaActividadUnidad) {
    if (actId && mapaActividadUnidad[actId] && mapaActividadUnidad[actId] <= totalUnidades) {
        return mapaActividadUnidad[actId];
    }
    if (/final|proyecto|integraci|examen/i.test(nom)) return totalUnidades || 1;
    let numNombre = obtenerNumeroUnidad(nom);
    if (numNombre !== null && numNombre <= totalUnidades && numNombre > 0) return numNombre;
    return (idxCol !== -1 && idxCol < totalUnidades) ? idxCol + 1 : (totalUnidades || 1);
}
function obtenerColorRendimiento(pct, fLimite) {
    let ahora = new Date();
    if (fLimite && ahora < fLimite) return pct >= 90 ? '#e8f8f5' : '#ffffff'; 
    if (pct < 50) return '#fadbd8';  
    if (pct < 90) return '#fdebd0';  
    return '#e8f8f5';               
}
function configurarColorAcceso(pAcceso) {
    let txt = pAcceso.toLowerCase();
    if (/nunca|mes|año/i.test(txt)) return '#c0392b'; 
    if (/(día|dia)/i.test(txt)) {
        let dias = parseInt(txt.match(/\d+/)?.[0] || 0);
        if (dias >= 7) return '#c0392b'; 
        if (dias >= 3) return '#e67e22'; 
        return '#27ae60'; 
    }
    return '#27ae60'; 
}
function iniciarPanelUI(){
    document.body.innerHTML=`<div id="panel-auditoria" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(245,247,250,0.98);z-index:9999;display:flex;justify-content:center;align-items:center;font-family:sans-serif;overflow-y:auto;"><div style="background:white;padding:35px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.1);text-align:center;width:480px;border:1px solid #e1e8ed;max-height:95vh;overflow-y:auto;"><h2 style="background:linear-gradient(135deg,#cc609b,#ff89c9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#cc609b;margin:0 0 10px 0;font-size:26px;font-weight:bold;letter-spacing:-0.5px;">Revisor eCampus (Escuela de Psicología)</h2><p style="color:#555;font-size:15px;margin:0 0 20px 0;font-weight:bold;">¿Qué deseas hacer?</p><button id="btnGeneral" style="width:100%;background:#27ae60;color:white;border:none;padding:14px;font-size:15px;font-weight:bold;border-radius:8px;cursor:pointer;margin-bottom:20px;transition:0.2s;">🚀 Revisión General de Asignaturas</button><div style="border-top:2px dashed #e1e8ed;margin:20px 0;"></div><h3 style="color:#7f8c8d;font-size:14px;margin-bottom:12px;text-align:left;font-weight:bold;">🔍 Búsqueda Rápida por Estudiante:</h3><input type="email" id="correoEstudiante" placeholder="Correo exacto del estudiante" style="width:100%;padding:11px;box-sizing:border-box;border:2px solid #bdc3c7;border-radius:8px;font-size:13px;margin-bottom:15px;outline:none;"><button id="btnEstudiante" style="width:100%;background:#2980b9;color:white;border:none;padding:14px;font-size:15px;font-weight:bold;border-radius:8px;cursor:pointer;transition:0.2s;">👤 Buscar en Todas las Aulas</button></div></div>`;
    document.getElementById('btnGeneral').addEventListener('click',()=>ejecutarExtractor(null));
    document.getElementById('btnEstudiante').addEventListener('click',()=>{
        let correo=document.getElementById('correoEstudiante').value.trim().toLowerCase();
        if(!correo||!correo.includes('@')){alert("Por favor, ingrese una dirección válida.");return;}
        ejecutarExtractor(correo);
    });
}
async function ejecutarExtractor(estudianteObjetivo){
    let esBusquedaEstudiante=estudianteObjetivo!==null;
    let datosExtraidos = [];
    
    document.body.innerHTML=`<div style='position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:9999;padding:50px;font-family:sans-serif;text-align:center;'><h2>${esBusquedaEstudiante?'🔍 Buscando estudiante...':'REVISANDO ASIGNATURAS'}</h2><div style='width:80%;background:#eee;height:20px;margin:20px auto;border-radius:10px;overflow:hidden;'><div id='p' style='width:0%;background:#2980b9;height:100%;transition:0.3s;'></div></div><p id='s'>Mapeando fechas y estructurando unidades...</p><p id='pct'>0%</p></div>`;
    
    for(let i=0;i<ids.length;i++){
        try{
            // 🛑 RESGUARDO: Pausa entre aulas para evitar congelamientos o caídas del servidor
            await esperar(300);
            
            let r = await fetchSeguro(`https://e-campus.uniacc.cl/grade/report/grader/index.php?id=${ids[i]}&perpage=5000&collapsed=0`);
            if(!r.ok) continue;
            
            let textGrader = await r.text();
            if(textGrader.includes("login/index.php")) {
                alert("⚠️ Su sesión de eCampus ha expirado. Por favor inicie sesión nuevamente.");
                location.reload();
                return;
            }
            if(esBusquedaEstudiante&&!textGrader.toLowerCase().includes(estudianteObjetivo)){
                document.getElementById('p').style.width=((i+1)/ids.length*100)+"%";
                document.getElementById('pct').textContent=`${i+1}/${ids.length} Aulas`;
                continue;
            }
            let d=new DOMParser().parseFromString(textGrader,"text/html");
            let nombreCurso=d.querySelector("h1")?.textContent.split('\n')[0].trim()||"ID "+ids[i];
            document.getElementById('p').style.width=((i+1)/ids.length*100)+"%";
            document.getElementById('pct').textContent=`${i+1}/${ids.length} Aulas`;
            document.getElementById('s').textContent="Procesando: "+nombreCurso;
            
            let linkAsignatura = `<a href="https://e-campus.uniacc.cl/course/view.php?id=${ids[i]}" target="_blank" style="color:#2980b9; text-decoration:none;">${nombreCurso}</a>`;
            
            let pNombre="No asignado",pCorreo="No disponible",pAcceso="Nunca ha ingresado",pId=null;
            let rProf = await fetchSeguro(`https://e-campus.uniacc.cl/user/index.php?id=${ids[i]}&perpage=5000`);
            if(rProf.ok){
                let dProf=new DOMParser().parseFromString(await rProf.text(),"text/html");
                let idxAcceso=-1;
                
                dProf.querySelectorAll('#participants thead th, .userlist table thead th').forEach((th,idx)=>{
                    let textTh=(th.textContent||"").toLowerCase();
                    if(textTh.includes("acceso")||textTh.includes("último")||textTh.includes("ultimo"))idxAcceso=idx;
                });
                
                let filasParticipantes=dProf.querySelectorAll('#participants tbody tr, .userlist table tbody tr');
                for(let row of filasParticipantes){
                    let textoFila=(row.textContent||"").toLowerCase();
                    if(textoFila.includes("profesor")||textoFila.includes("docente")||textoFila.includes("tutor")){
                        let linkNombre=row.querySelector('a[href*="user/view.php"], a[href*="user/profile.php"]');
                        if(linkNombre){
                            if(pId===null){
                                let matchId=linkNombre.href.match(/id=(\d+)/);
                                if(matchId) pId=matchId[1]; 
                                
                                let clonL = linkNombre.cloneNode(true);
                                clonL.querySelectorAll('.userinitials, .initials, .sr-only, .accesshide').forEach(el => el.remove());
                                let rawName = (clonL.textContent||"").replace(/\s+/g,' ').trim();
                                if(rawName.toLowerCase().startsWith("bp") && rawName.length > 5) { rawName = rawName.substring(2).trim(); }
                                pNombre = rawName;
                                
                                let matchCorreo=row.innerHTML.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
                                if(matchCorreo)pCorreo=matchCorreo[0];
                                let celdaAcceso=(idxAcceso!==-1&&row.cells[idxAcceso])?row.cells[idxAcceso]:row.querySelector('.column-lastaccess');
                                if(celdaAcceso&&(celdaAcceso.textContent||"").trim()!=="") pAcceso=(celdaAcceso.textContent||"").trim();
                            }
                        }
                    }
                }
            }
            let rCurso = await fetchSeguro(`https://e-campus.uniacc.cl/course/view.php?id=${ids[i]}`);
            let dCurso = new DOMParser().parseFromString(rCurso.ok ? await rCurso.text() : "", "text/html");
            
            let fechasSecuenciales = [];
            let mapaActividadUnidad = {}; 
            let mapaActividadFechas = {};
            let secciones = dCurso.querySelectorAll('#accordionEx1 > .card, .course-content li.section, .course-content .section');
            
            secciones.forEach(sec => {
                let headerEl = sec.querySelector('.card-header, .sectionname, h3, h4, h5');
                let headerTxt = headerEl ? normalizarTexto(headerEl.textContent) : '';
                let esSeccionUnidad = /unidad|\bu\d+\b|modulo|módulo/i.test(headerTxt);
                let textoEl = sec.querySelector('.availabilityinfo, .section_availability, [data-region="availabilityinfo"], .isrestricted');
                let fecha = "";
                if (textoEl) {
                    let txt = textoEl.textContent.replace(/\s+/g, ' ');
                    let match = txt.match(/(?:disponible desde|disponible a partir de|abre:|desde)\s+([a-z0-9\sde]+)/i);
                    if (match && match[1]) {
                        fecha = match[1].trim();
                    } else {
                        let strong = textoEl.querySelector('strong');
                        if (strong) fecha = strong.textContent.trim();
                    }
                }
                if (fecha && !fechasSecuenciales.includes(fecha)) fechasSecuenciales.push(fecha);
                
                let contadorUnidadMapeada = fechasSecuenciales.length; 
                let unidadAsignadaSec = (contadorUnidadMapeada > 0 || esSeccionUnidad) ? (contadorUnidadMapeada || 1) : null;
                
                sec.querySelectorAll('a[href*="/mod/"]').forEach(a => {
                    let m = a.href.match(/id=(\d+)/);
                    if (m) mapaActividadUnidad[m[1]] = unidadAsignadaSec;
                });
            });
            dCurso.querySelectorAll('.modtype_quiz, .modtype_assign, .activity, li.activity, .course-content li, .card').forEach(actEl => {
                let link = actEl.querySelector('a[href*="/mod/"]');
                if (!link) return;
                let m = link.href.match(/id=(\d+)/);
                if (!m) return;
                let actId = m[1];
                let txt = actEl.textContent.replace(/\s+/g, ' ');
                let matchApertura = txt.match(/(?:apertura|abre):\s*([a-z0-9áéíóúñ\s,]+?\d+\s+de\s+[a-z]+(?:\s+de\s+\d{4})?)/i);
                let matchCierre = txt.match(/(?:cierre|vencimiento|hasta|cierra):\s*([a-z0-9áéíóúñ\s,]+?\d+\s+de\s+[a-z]+(?:\s+de\s+\d{4})?)/i);
                let aperturaVal = matchApertura ? matchApertura[1].trim() : null;
                let cierreVal = matchCierre ? matchCierre[1].trim() : null;
                if (aperturaVal || cierreVal) {
                    mapaActividadFechas[actId] = { apertura: aperturaVal, cierre: cierreVal };
                }
            });
            let arregloUnidades = [];
            for (let idx = 0; idx < fechasSecuenciales.length; idx++) {
                arregloUnidades.push({
                    numeroUnidad: idx + 1,
                    inicio: fechasSecuenciales[idx],
                    termino: (idx + 1 < fechasSecuenciales.length) ? fechasSecuenciales[idx + 1] : "Cierre del curso"
                });
            }
            
            let cicloAsignatura = determinarCicloAsignatura(nombreCurso, arregloUnidades, mapaActividadFechas);
            let filaMaestra=Array.from(d.querySelectorAll('table tr')).find(f=>(f.textContent||"").includes("Nombre / Apellido")||(f.textContent||"").includes("Dirección de correo"));
            if(filaMaestra){
                let colValidas=[];
                Array.from(filaMaestra.cells).forEach((celda,idx)=>{
                    let nom=(celda.textContent||"").replace(/Vista única|Ascendente|Descendente|Colapsar|Expandir columna/gi,'').trim().split('\n')[0];
                    let nomNorm = normalizarTexto(nom);
                    
                    let esExcluido = /total|promedio|\bad\b|diagnost|entrada|caracterizac|encuesta|asistencia|repetici|nota final|calificacion final/i.test(nomNorm);
                    let esEvaluacion = /foro|control|evaluaci|examen|sumativa|formativa|tarea|unidad|prueba|cuestionario|final|proyecto|integraci/i.test(nomNorm);
                    
                    if(esEvaluacion && !esExcluido){
                        let linkActividad=celda.querySelector('a[href*="mod/"]');
                        let actId = null;
                        if (linkActividad) {
                            let matchId = linkActividad.href.match(/id=(\d+)/);
                            if (matchId) actId = matchId[1];
                        }
                        let esForo = /foro/i.test(nomNorm);
                        if (esForo) {
                            if (/\bad\b|diagnost|entrada|presentac|bienvenid|consult|duda|aviso|novedad|cafeter|social|orientac|tecnic/i.test(nomNorm)) {
                                return; 
                            }
                            let esSalaDeClase = /sala de clase/i.test(nomNorm);
                            let numUnidadNombre = obtenerNumeroUnidad(nom);
                            let unidadMapa = actId ? mapaActividadUnidad[actId] : null;
                            let tieneUnidadNombre = /unidad|\bu\d+\b|sumativ|formativ|evaluad/i.test(nomNorm);
                            
                            let esForoValido = esSalaDeClase || (numUnidadNombre !== null && numUnidadNombre > 0) || (unidadMapa !== null && unidadMapa > 0) || tieneUnidadNombre;
                            
                            if (!esForoValido) {
                                return; 
                            }
                        }
                        colValidas.push({idx:idx,nom:nom,urlDirecta:linkActividad?linkActividad.href:null, actId: actId});
                    }
                });
                
                let filasDatos=d.querySelectorAll('table tbody tr');
                
                if(esBusquedaEstudiante){
                    let filaEstudiante=Array.from(filasDatos).find(row=>(row.innerHTML.toLowerCase().includes(estudianteObjetivo))||(row.textContent||"").toLowerCase().includes(estudianteObjetivo));
                    if(filaEstudiante&&colValidas.length>0){
                        let cursoObj = { nombreCurso, linkAsignatura, cicloAsignatura, pNombre, items: [] };
                        for(let indiceColumna=0;indiceColumna<colValidas.length;indiceColumna++){
                            let col=colValidas[indiceColumna];
                            let rawNota=filaEstudiante.cells[col.idx]?.textContent||"-";
                            let notaTexto=rawNota.replace(/Acciones de la celda|Análisis de calificaciones|Ver retroalimentación/gi,'').trim()||"-";
                            
                            let unidadAsignada = asignarUnidad(col.nom, colValidas.indexOf(col), arregloUnidades.length, col.actId, mapaActividadUnidad);
                            let fechaAperturaEsp = col.actId && mapaActividadFechas[col.actId] ? mapaActividadFechas[col.actId].apertura : null;
                            let fIniTexto = fechaAperturaEsp || (arregloUnidades[unidadAsignada - 1] ? arregloUnidades[unidadAsignada - 1].inicio : null);
                            let fInicioObj = parsearFechaMoodle(fIniTexto);

                            let statusForo="No aplica";
                            if(/foro/i.test(col.nom)) statusForo=await verificarEstadoForo(col,ids[i],pNombre,pId, dCurso, fInicioObj);
                            
                            let nombreCorto = generarNombreCorto(col.nom, unidadAsignada);
                            let fechaCierreEsp = col.actId && mapaActividadFechas[col.actId] ? mapaActividadFechas[col.actId].cierre : null;
                            let fechasStr = "No especificada";
                            if (fechaCierreEsp) {
                                let fIni = fechaAperturaEsp || (arregloUnidades[unidadAsignada - 1] ? arregloUnidades[unidadAsignada - 1].inicio : "No especificada");
                                fechasStr = `<b>Inicio:</b> ${fIni}<br><b>Término:</b> ${fechaCierreEsp}`;
                            } else if (arregloUnidades[unidadAsignada - 1]) {
                                let uObj = arregloUnidades[unidadAsignada - 1];
                                fechasStr = `<b>Inicio:</b> ${uObj.inicio}<br><b>Término:</b> ${uObj.termino}`;
                            }
                            cursoObj.items.push({ colNom: nombreCorto, statusForo, notaTexto, fechasStr });
                        }
                        if(cursoObj.items.length > 0) datosExtraidos.push(cursoObj);
                    }
                }else{
                    let filasAImprimir = [];
                    for(let col of colValidas){
                        let faltan=0,totalAlumnos=0;
                        let estudiantesSinNota = []; 
                        filasDatos.forEach(row=>{
                            let linkEstudiante = row.querySelector('a[href*="user/view.php"], a[href*="user/profile.php"]');
                            if(linkEstudiante){
                                totalAlumnos++;
                                let nota=parseFloat((row.cells[col.idx]?.textContent||"").replace(/[^\d,\.-]/g,'').replace(',','.'));
                                if(isNaN(nota)||nota<1.0||nota>7.0){
                                    faltan++;
                                    let clonEst = linkEstudiante.cloneNode(true);
                                    clonEst.querySelectorAll('.userinitials, .initials, .sr-only, .accesshide').forEach(el => el.remove());
                                    estudiantesSinNota.push((clonEst.textContent||"").replace(/\s+/g,' ').trim());
                                }
                            }
                        });
                        if(totalAlumnos>0){
                            let unidadAsignada = asignarUnidad(col.nom, colValidas.indexOf(col), arregloUnidades.length, col.actId, mapaActividadUnidad);
                            let nombreCorto = generarNombreCorto(col.nom, unidadAsignada);
                            let fechaAperturaEsp = col.actId && mapaActividadFechas[col.actId] ? mapaActividadFechas[col.actId].apertura : null;
                            let fechaCierreEsp = col.actId && mapaActividadFechas[col.actId] ? mapaActividadFechas[col.actId].cierre : null;
                            
                            let fIniTexto = fechaAperturaEsp || (arregloUnidades[unidadAsignada - 1] ? arregloUnidades[unidadAsignada - 1].inicio : null);
                            let fInicioObj = parsearFechaMoodle(fIniTexto);

                            let statusForo="No aplica";
                            if(/foro/i.test(col.nom)) statusForo=await verificarEstadoForo(col,ids[i],pNombre,pId, dCurso, fInicioObj);

                            let fechasStr = "No especificada";
                            let textoTermino = "Cierre del curso";
                            let fLimite = null;
                            if (fechaCierreEsp) {
                                let fIni = fechaAperturaEsp || (arregloUnidades[unidadAsignada - 1] ? arregloUnidades[unidadAsignada - 1].inicio : "No especificada");
                                fechasStr = `<b>Inicio:</b> ${fIni}<br><b>Término:</b> ${fechaCierreEsp}`;
                                textoTermino = fechaCierreEsp;
                                let fTerminoObj = parsearFechaMoodle(fechaCierreEsp);
                                if (fTerminoObj) {
                                    fLimite = new Date(fTerminoObj.getTime() + (7 * 24 * 60 * 60 * 1000));
                                }
                            } else if (arregloUnidades[unidadAsignada - 1]) {
                                let uObj = arregloUnidades[unidadAsignada - 1];
                                fechasStr = `<b>Inicio:</b> ${uObj.inicio}<br><b>Término:</b> ${uObj.termino}`;
                                textoTermino = uObj.termino;
                                let totalUn = arregloUnidades.length;
                                let esUnidadFinal = (unidadAsignada === totalUn);
                                let esExamenFinal = /final|proyecto|integraci|examen/i.test(col.nom);
                                
                                if ((totalUn === 4 || totalUn === 5) && (esUnidadFinal || esExamenFinal)) {
                                    let fInicioObjUnit = parsearFechaMoodle(uObj.inicio);
                                    if (fInicioObjUnit) {
                                        let diasExtra = (totalUn === 4) ? 14 : 35;
                                        fLimite = new Date(fInicioObjUnit.getTime() + (diasExtra * 24 * 60 * 60 * 1000));
                                    }
                                } else {
                                    let fTermino = parsearFechaMoodle(textoTermino);
                                    if (fTermino) fLimite = new Date(fTermino.getTime() + (7 * 24 * 60 * 60 * 1000));
                                }
                            }
                            filasAImprimir.push({
                                colNom: nombreCorto,
                                statusForo: statusForo, faltan: faltan,
                                totalAlumnos: totalAlumnos, rendimiento: Math.round((totalAlumnos-faltan)/totalAlumnos*100),
                                fechasStr: fechasStr, textoTermino: textoTermino,
                                estudiantesSinNota: estudiantesSinNota,
                                fLimite: fLimite 
                            });
                        }
                    }
                    
                    if(filasAImprimir.length > 0) {
                        let cAcceso = configurarColorAcceso(pAcceso);
                        let cursoObj = { nombreCurso, linkAsignatura, cicloAsignatura, pNombre, pCorreo, pAcceso, cAcceso, items: filasAImprimir };
                        let cursoFaltanNotas = filasAImprimir.some(item => {
                            if(item.faltan === 0) return false;
                            if(item.fLimite && new Date() < item.fLimite) return false; 
                            return true;
                        });
                        let cursoFaltaForo = filasAImprimir.some(item => item.statusForo.includes('❌ No'));
                        
                        let accMinText = pAcceso.toLowerCase();
                        let sinAcceso7Dias = false;
                        if (/nunca|mes|año/.test(accMinText)) { sinAcceso7Dias = true; } 
                        else if (/(día|dia)/.test(accMinText)) {
                            let numDias = parseInt(accMinText.match(/\d+/)?.[0] || 0);
                            if (numDias >= 7) sinAcceso7Dias = true;
                        }
                        
                        let textoExplicacionCeros = "En caso de haber revisado todos los trabajos, y que aun falten notas, es porque debe ingresar el 1,0 a aquellos estudiantes que no hayan entregado la evaluación. Esto se puede hacer a través de la rúbrica (marcando todos los puntajes mínimos) o editando el libro de calificaciones e ingresando directamente el 1,0 en aquellas casillas vacías.";
                        
                        let resumenNotasFaltantes = ""; 
                        let resumenNotasTodoPendiente = ""; 
                        let tieneNotasParaTodoPendiente = false;
                        filasAImprimir.forEach(item => {
                            if(item.faltan > 0) {
                                let pasoPlazo = true;
                                if(item.fLimite && new Date() < item.fLimite) pasoPlazo = false; 
                                if(pasoPlazo) {
                                    let textoLinea = `\n - ${item.colNom}: faltan ${item.faltan} estudiante${item.faltan > 1 ? 's' : ''}`;
                                    resumenNotasFaltantes += textoLinea;
                                    
                                    if(!/formativa/i.test(item.colNom)) {
                                        resumenNotasTodoPendiente += textoLinea;
                                        tieneNotasParaTodoPendiente = true;
                                    }
                                }
                            }
                        });
                        let arrayBotones = [];
                        let listaPendientesMaestra = [];
                        if(sinAcceso7Dias) listaPendientesMaestra.push("- Regularizar su acceso a la plataforma (registra alerta de inactividad).");
                        if(cursoFaltaForo) listaPendientesMaestra.push("- Participación, respuesta o moderación en los foros de discusión.");
                        if(tieneNotasParaTodoPendiente) listaPendientesMaestra.push("- Ingreso de calificaciones pendientes en el libro de notas (plazo de revisión cumplido).");
                        
                        let enc = s => encodeURIComponent(s).replace(/'/g, "%27");
                        let safeCorreo = enc(pCorreo);
                        if(listaPendientesMaestra.length > 0 && pCorreo.includes('@')) {
                            let subjTodo = enc(`Recordatorio de Pendientes Urgentes - ${nombreCurso}`);
                            let intro = enc(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo para comunicarle que la plataforma registra las siguientes actividades pendientes por regularizar en la asignatura ${nombreCurso}:\n\n${listaPendientesMaestra.join('\n')}`);
                            let detalles = enc(tieneNotasParaTodoPendiente ? `\n\nActividades con calificaciones pendientes:${resumenNotasTodoPendiente}` : '');
                            let explicacion = enc(tieneNotasParaTodoPendiente ? `\n\n${textoExplicacionCeros}` : '');
                            let despedida = enc(`\n\nLe recordamos la importancia de mantener estas actividades al día para el correcto seguimiento de nuestros estudiantes.\n\nQuedo atento/a ante cualquier duda o inconveniente técnico.\n\nSaludos cordiales.`);
                            
                            arrayBotones.push(`<button onclick="window.enviarCorreoSeguro('${safeCorreo}', '${subjTodo}', '${intro}', '${detalles}', '${explicacion}', '${despedida}')" style="display:inline-block;width:100px;padding:6px;background:#34495e;color:white;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;border:1px solid #2c3e50;cursor:pointer;">✉️ Todo Pendiente</button>`);
                            arrayBotones.push(`<div style="height:4px; border-bottom:1px dashed #ccc; margin-bottom:4px;"></div>`);
                        }
                        if(cursoFaltanNotas && pCorreo.includes('@')) {
                            let subjNotas = enc(`Pendiente ingreso de calificaciones - ${nombreCurso}`);
                            let intro = enc(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo para recordarle que existen calificaciones pendientes por ingresar en la asignatura ${nombreCurso}:`);
                            let detalles = enc(`\n${resumenNotasFaltantes}`);
                            let explicacion = enc(`\n\n${textoExplicacionCeros}`);
                            let despedida = enc(`\n\nQuedo atento/a ante cualquier duda o problema con la plataforma.\n\nSaludos cordiales.`);
                            
                            arrayBotones.push(`<button onclick="window.enviarCorreoSeguro('${safeCorreo}', '${subjNotas}', '${intro}', '${detalles}', '${explicacion}', '${despedida}')" style="display:inline-block;width:100px;padding:6px;background:#e67e22;color:white;border:none;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;cursor:pointer;">✉️ Faltan Notas</button>`);
                        }
                        if(cursoFaltaForo && pCorreo.includes('@')) {
                            let subjForo = enc(`Pendiente participación en foros - ${nombreCurso}`);
                            let intro = enc(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo para recordarle que se encuentra pendiente su participación/moderación en los foros de la asignatura ${nombreCurso}.`);
                            let despedida = enc(`\n\nQuedo atento/a ante cualquier duda o problema con la plataforma.\n\nSaludos cordiales.`);
                            
                            arrayBotones.push(`<button onclick="window.enviarCorreoSeguro('${safeCorreo}', '${subjForo}', '${intro}', '', '', '${despedida}')" style="display:inline-block;width:100px;padding:6px;background:#c0392b;color:white;border:none;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;cursor:pointer;">✉️ Falta Foro</button>`);
                        }
                        if(sinAcceso7Dias && pCorreo.includes('@')) {
                            let subjAcceso = enc(`Alerta de inactividad - ${nombreCurso}`);
                            let intro = enc(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo debido a que el sistema registra que no ha ingresado a la plataforma por 7 días o más en la asignatura ${nombreCurso}.\n\nLe recordamos la importancia de mantener una revisión constante para el buen desarrollo del curso.`);
                            let despedida = enc(`\n\nQuedo atento/a ante cualquier inconveniente técnico o personal.\n\nSaludos cordiales.`);
                            
                            arrayBotones.push(`<button onclick="window.enviarCorreoSeguro('${safeCorreo}', '${subjAcceso}', '${intro}', '', '', '${despedida}')" style="display:inline-block;width:100px;padding:6px;background:#8e44ad;color:white;border:none;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;cursor:pointer;">✉️ Sin Acceso</button>`);
                        }
                        
                        cursoObj.celdaAcciones = arrayBotones.join('<div style="height:6px;"></div>');
                        datosExtraidos.push(cursoObj);
                    }
                }
            }
        }catch(e){console.error("Error en aula ID "+ids[i],e);}
    }
    
    if(datosExtraidos.length === 0){
        document.body.innerHTML=`<div style='padding:40px;text-align:center;'><h2 style='color:#c0392b;'>⚠️ No se encontraron resultados</h2><button onclick='location.reload()' style='padding:12px 25px;background:#2980b9;color:white;border:none;border-radius:6px;cursor:pointer;'>Volver</button></div>`;
        return;
    }
    let cabeceraSuperior = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:2px solid ${esBusquedaEstudiante?'#2980b9':'#27ae60'}; padding-bottom:10px;">
        <h2 style='color:${esBusquedaEstudiante?'#2980b9':'#27ae60'}; margin:0;'>${esBusquedaEstudiante?'👤 Historial: '+estudianteObjetivo:'✅ Auditoría Consolidada (Blindada)'}</h2>
        <div>
            <button id="btnDashboard" style="padding:10px 15px; background:#8e44ad; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin-right:10px; transition:0.2s;">📊 Dashboard</button>
            <button id="btnExportar" style="padding:10px 15px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin-right:10px; transition:0.2s;">📥 Exportar Excel</button>
            <button onclick='location.reload()' style='padding:10px 15px; background:#7f8c8d; color:white; border:none; border-radius:6px; cursor:pointer; transition:0.2s;'>⬅️ Volver</button>
        </div>
    </div>`;
    
    let titulosColumnas = esBusquedaEstudiante 
        ? ['Asignatura', 'Ciclo', 'Docente', 'Fechas Homologadas', 'Evaluación', 'Nota'] 
        : ['Asignatura', 'Ciclo', 'Docente', 'Correo', 'Último Acceso', 'Acciones Consolidadas', 'Fechas Homologadas', 'Evaluación', '¿Docente Participó?', 'Faltan', 'Alumnos', 'Rendimiento', 'Detalle'];
    
    let theadCompleto = `
    <thead style='background:${esBusquedaEstudiante?'#2980b9':'#27ae60'};color:white;position:sticky;top:0;z-index:10;'>
        <tr>${titulosColumnas.map(t => `<th style='padding:10px;border:1px solid #bdc3c7;'>${t}</th>`).join('')}</tr>
        <tr class="fila-filtros" style="background:#eaeded;">
            ${titulosColumnas.map((_, i) => {
                if(!esBusquedaEstudiante && (i === 5 || i === 12)) return `<th style='padding:4px;border:1px solid #bdc3c7;'><input class="filtro-col" disabled type="text" style="width:100%;box-sizing:border-box;font-size:11px;padding:5px;border:1px solid #ccc;border-radius:4px;background:#ddd;cursor:not-allowed;"></th>`;
                return `<th style='padding:4px;border:1px solid #bdc3c7;'><input class="filtro-col" type="text" placeholder="Filtrar..." style="width:100%;box-sizing:border-box;font-size:11px;padding:5px;border:1px solid #ccc;border-radius:4px;outline:none;"></th>`;
            }).join('')}
        </tr>
    </thead>`;
    document.body.innerHTML=`<div style='padding:20px; font-family:sans-serif;'>${cabeceraSuperior}<div style='overflow-x:auto; max-height:85vh; border:1px solid #bdc3c7; box-shadow:0 5px 15px rgba(0,0,0,0.05);'><table id='tablaAuditoria' style='border-collapse:collapse;width:100%;font-size:12px;'>${theadCompleto}<tbody></tbody></table></div></div>`;
    
    document.querySelectorAll('.filtro-col').forEach(input => {
        input.addEventListener('input', renderTabla);
    });
    const btnDash = document.getElementById('btnDashboard');
    if (btnDash) {
        btnDash.onclick = () => window.mostrarDashboardModal(datosExtraidos, esBusquedaEstudiante);
    }
    
    const btnExp = document.getElementById('btnExportar');
    if (btnExp) {
        btnExp.onclick = () => {
            let table = document.getElementById('tablaAuditoria');
            let htmlTable = table.outerHTML;
            htmlTable = htmlTable.replace(/<input[^>]*>/gi, '');
            htmlTable = htmlTable.replace(/<button[^>]*>.*?<\/button>/gi, '');
            let blob = new Blob(['\ufeff' + htmlTable], { type: 'application/vnd.ms-excel' });
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = `Auditoria_${new Date().toISOString().split('T')[0]}.xls`;
            a.click();
        };
    }
    
    function renderTabla(){
        let inputs = Array.from(document.querySelectorAll('.filtro-col')).map(el => el.value.toLowerCase().trim());
        let html = "";
        let contador = 0;
        
        for(let i = 0; i < datosExtraidos.length; i++){
            let curso = datosExtraidos[i];
            
            let itemsFiltrados = curso.items.filter(item => {
                if(esBusquedaEstudiante) {
                    if(inputs[0] && !curso.nombreCurso.toLowerCase().includes(inputs[0])) return false;
                    if(inputs[1] && !curso.cicloAsignatura.toLowerCase().includes(inputs[1])) return false;
                    if(inputs[2] && !curso.pNombre.toLowerCase().includes(inputs[2])) return false;
                    if(inputs[3] && !item.fechasStr.toLowerCase().includes(inputs[3])) return false;
                    if(inputs[4] && !(item.colNom + " " + item.statusForo).toLowerCase().includes(inputs[4])) return false;
                    if(inputs[5] && !item.notaTexto.toLowerCase().includes(inputs[5])) return false;
                    return true;
                } else {
                    if(inputs[0] && !curso.nombreCurso.toLowerCase().includes(inputs[0])) return false;
                    if(inputs[1] && !curso.cicloAsignatura.toLowerCase().includes(inputs[1])) return false;
                    if(inputs[2] && !curso.pNombre.toLowerCase().includes(inputs[2])) return false;
                    if(inputs[3] && !curso.pCorreo.toLowerCase().includes(inputs[3])) return false;
                    if(inputs[4] && !curso.pAcceso.toLowerCase().includes(inputs[4])) return false;
                    if(inputs[6] && !item.fechasStr.toLowerCase().includes(inputs[6])) return false;
                    if(inputs[7] && !item.colNom.toLowerCase().includes(inputs[7])) return false;
                    if(inputs[8] && !item.statusForo.toLowerCase().includes(inputs[8])) return false;
                    if(inputs[9] && !item.faltan.toString().includes(inputs[9])) return false;
                    if(inputs[10] && !item.totalAlumnos.toString().includes(inputs[10])) return false;
                    if(inputs[11] && !(item.rendimiento+"%").includes(inputs[11])) return false;
                    return true;
                }
            });
            if(itemsFiltrados.length > 0) {
                let bg = coloresPastel[contador % coloresPastel.length];
                contador++;
                let rs = itemsFiltrados.length;
                
                for(let k = 0; k < itemsFiltrados.length; k++){
                    let it = itemsFiltrados[k];
                    let estiloSeparador = k === 0 ? 'border-top: 3.5px solid #95a5a6;' : '';
                    html += `<tr style='background-color:${bg};'>`;
                    if(k === 0) {
                        if(esBusquedaEstudiante) {
                            html += `<td rowspan="${rs}" style='padding:12px;border:1px solid #bdc3c7;${estiloSeparador}font-weight:bold;'>${curso.linkAsignatura}</td>
                                     <td rowspan="${rs}" style='padding:12px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;'>${curso.cicloAsignatura}</td>
                                     <td rowspan="${rs}" style='padding:12px;border:1px solid #bdc3c7;${estiloSeparador}font-weight:bold;'>${curso.pNombre}</td>`;
                        } else {
                            html += `<td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}font-weight:bold;'>${curso.linkAsignatura}</td>
                                     <td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;'>${curso.cicloAsignatura}</td>
                                     <td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}font-weight:bold;'>${curso.pNombre}</td>
                                     <td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}color:#2980b9;'>${curso.pCorreo}</td>
                                     <td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}color:${curso.cAcceso};font-weight:bold;'>${curso.pAcceso}</td>
                                     <td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;vertical-align:middle;'>${curso.celdaAcciones}</td>`;
                        }
                    }
                    if(esBusquedaEstudiante) {
                        html += `<td style='padding:10px;border:1px solid #bdc3c7;${estiloSeparador} font-size:11px;'>${it.fechasStr}</td>
                                 <td style='padding:10px;border:1px solid #bdc3c7;${estiloSeparador}'>${it.colNom} ${it.statusForo!=='No aplica'&&!it.statusForo.includes('No')?`(${it.statusForo})`:''}</td>
                                 <td style='padding:10px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;font-weight:bold;'>${it.notaTexto}</td></tr>`;
                    } else {
                        let bgRendimiento = obtenerColorRendimiento(it.rendimiento, it.fLimite);
                        let safeEstudiantes = encodeURIComponent(it.estudiantesSinNota.join('||')).replace(/'/g, "%27");
                        let btnDetalle = it.faltan > 0 
                            ? `<button onclick="window.mostrarEstudiantesSinNota('${safeEstudiantes}')" style="padding:4px 8px; background:#e74c3c; color:white; border:none; border-radius:4px; cursor:pointer; font-size:10px; font-weight:bold;">Ver Alumnos</button>` 
                            : `<span style="color:#7f8c8d;font-size:10px;">Completo</span>`;
                        html += `<td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}font-size:11px;'>${it.fechasStr}</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}'>${it.colNom}</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;'>${it.statusForo}</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;font-weight:bold;color:${it.faltan>0?"#c0392b":"#27ae60"};'>${it.faltan}</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;'>${it.totalAlumnos}</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;font-weight:bold;background-color:${bgRendimiento};'>${it.rendimiento}%</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;'>${btnDetalle}</td>
                                 </tr>`;
                    }
                }
            }
        }
        document.querySelector('#tablaAuditoria tbody').innerHTML = html;
    }
    
    renderTabla();
}

// 🎯 REVISIÓN DE FOROS PRECISA Y ROBUSTA
async function verificarEstadoForo(col, idCurso, pNombre, pId, dCursoPreload, fInicioObj) {
    let aunNoInicia = fInicioObj && (new Date() < fInicioObj);

    let urlForoObjetivo = col.urlDirecta && (col.urlDirecta.includes("mod/forum/view.php") || col.urlDirecta.includes("mod/forum/discuss.php")) ? col.urlDirecta : null;
    
    if (!urlForoObjetivo || !urlForoObjetivo.includes("forum")) {
        try {
            let numsCol = normalizarTexto(col.nom).match(/\d+/g) || [];
            let dCurso = dCursoPreload; 
            let secciones = dCurso.querySelectorAll('#accordionEx1 > .card, .course-content .section');
            let forosCandidatos = [];
            secciones.forEach(seccion => {
                let header = seccion.querySelector('.card-header h5, .sectionname');
                let tituloSeccion = header ? normalizarTexto(header.textContent) : '';
                let numsSeccion = tituloSeccion.match(/\d+/g) || [];
                let numeroCoincide = true;
                if (numsCol.length > 0 && numsSeccion.length > 0) numeroCoincide = numsCol.some(n => numsSeccion.includes(n));
                if (numeroCoincide) {
                    let enlacesForo = seccion.querySelectorAll('a[href*="/mod/forum/view.php"], a[href*="/mod/forum/discuss.php"]');
                    enlacesForo.forEach(enlace => {
                        let tituloForo = normalizarTexto(enlace.textContent);
                        let esForoInvalido = /\bad\b|diagnost|entrada|duda|aviso|presenta|cafeter|tecnic|consult/i.test(tituloForo);
                        let esForoValido = /sala de clase|unidad|\bu\d+\b|sumativ|formativ|evaluad/i.test(tituloForo);
                        if (!esForoInvalido && esForoValido) {
                            forosCandidatos.push({
                                href: enlace.href,
                                esSalaDeClases: tituloForo.includes("sala de clase") || tituloForo.includes("evaluado")
                            });
                        }
                    });
                }
            });
            let mejorCandidato = forosCandidatos.find(f => f.esSalaDeClases);
            if (mejorCandidato) urlForoObjetivo = mejorCandidato.href;
            else if (forosCandidatos.length > 0) urlForoObjetivo = forosCandidatos[0].href;
        } catch(e) { console.error("Error al rastrear unidad", e); }
    }
    
    if (!urlForoObjetivo) {
        return aunNoInicia 
            ? "<span style='color:#f39c12;font-weight:bold;'>🟡 Aún no inicia</span>" 
            : "<span style='color:#c0392b;font-weight:bold;'>❌ No hay foro</span>";
    }

    let linkDebug = `<br><a href="${urlForoObjetivo}" target="_blank" style="font-size:10px;color:#3498db;text-decoration:none;">🔗 Ver foro</a>`;
    
    try {
        let rForo = await fetchSeguro(urlForoObjetivo);
        if (!rForo.ok) {
            return aunNoInicia 
                ? `<span style='color:#f39c12;font-weight:bold;'>🟡 Aún no inicia</span>${linkDebug}` 
                : "<span style='color:#7f8c8d;'>⚠️ Error</span>";
        }
        
        let dForo = new DOMParser().parseFromString(await rForo.text(), "text/html");
        let profeEncontrado = false;
        let estudiantes = new Set();

        function analizarContenidoForo(doc) {
            let areaPrincipal = doc.querySelector('#region-main, #content, .main-content, #page-content') || doc.body;
            let userLinks = areaPrincipal.querySelectorAll('a[href*="user/view.php"], a[href*="user/profile.php"]');
            
            userLinks.forEach(a => {
                let href = a.href || "";
                let matchId = href.match(/[?&]id=(\d+)/);
                let uid = matchId ? matchId[1] : null;
                
                if (uid && pId && String(uid) === String(pId)) {
                    profeEncontrado = true;
                } else {
                    let clon = a.cloneNode(true);
                    clon.querySelectorAll('.userinitials, .initials, .sr-only, .accesshide').forEach(el => el.remove());
                    let nombre = clon.textContent.replace(/\s+/g, ' ').trim();
                    
                    if (nombre && nombre.length > 2 && !nombre.toLowerCase().includes('profesor') && !nombre.toLowerCase().includes('docente')) {
                        estudiantes.add(nombre);
                    }
                }
            });
        }

        analizarContenidoForo(dForo);

        let areaMain = dForo.querySelector('#region-main, #content, .main-content, #page-content') || dForo.body;
        let linksDebates = Array.from(areaMain.querySelectorAll('a[href*="discuss.php?d="]')).map(a => a.href.split('#')[0]);
        let linksUnicos = [...new Set(linksDebates)].slice(0, 6);
        for (let link of linksUnicos) {
            if (profeEncontrado) break;
            try {
                let rDeb = await fetchSeguro(link);
                if (!rDeb.ok) continue;
                let docDeb = new DOMParser().parseFromString(await rDeb.text(), "text/html");
                analizarContenidoForo(docDeb);
                await esperar(250);
            } catch(e) {}
        }

        if (profeEncontrado) return `<span style='color:#27ae60;font-weight:bold;'>✅ Sí</span>${linkDebug}`;
        
        if (aunNoInicia) {
            return `<span style='color:#f39c12;font-weight:bold;'>🟡 Aún no inicia</span>${linkDebug}`;
        }

        let arrEstudiantes = Array.from(estudiantes);
        if (arrEstudiantes.length === 0) {
            return `<span style='color:#c0392b;font-weight:bold;'>❌ No hay foro</span><br><small style='font-size:10px;color:#888;'>Sin discusiones</small>${linkDebug}`;
        }
        
        let muestra = arrEstudiantes.slice(0, 2).join(', ');
        if (arrEstudiantes.length > 2) muestra += '...';
        return `<span style='color:#c0392b;font-weight:bold;'>❌ No hay foro</span><br><small style='font-size:10px;color:#888;'>Alumnos: ${muestra}</small>${linkDebug}`;
        
    } catch(e) { 
        return aunNoInicia 
            ? `<span style='color:#f39c12;font-weight:bold;'>🟡 Aún no inicia</span>` 
            : "<span style='color:#7f8c8d;'>⚠️ Error</span>"; 
    }
}
iniciarPanelUI();
})();
