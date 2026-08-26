/* 👇 TODOS TUS IDs CARGADOS 👇 */
const ids = [56087, 56101, 55189, 55203, 55215, 55221, 56088, 56102, 56111, 55190, 55341, 56089, 56103, 56083, 55191, 55204, 55192, 55205, 55216, 55222, 55343, 56090, 56104, 55193, 55206, 56091, 55194, 55207, 56092, 55195, 56093, 55196, 55208, 55217, 56094, 56105, 55197, 55209, 56095, 56195, 55198, 55210, 55218, 55344, 56096, 56106, 56112, 56114, 56097, 56107, 55199, 55211, 55219, 55223, 55345, 56098, 56108, 56113, 55200, 55212, 55346, 56099, 56109, 55201, 55213, 56048, 56051, 56054, 56062, 56221, 56067, 56070, 56194, 56100, 56110, 55202, 55214, 55220, 55224, 55226, 55227, 55228, 55229, 55230, 55231, 55232, 55233, 55234, 55235, 55236, 55237, 55238, 55348, 55349, 55350, 55351, 56049, 56052, 56055, 56057, 56063, 56065, 56068, 56071, 56073, 56075, 56077];
const coloresPastel = ['#ffffff', '#fcfcfc']; 

const esperar = ms => new Promise(res => setTimeout(res, ms));

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
    return t ? t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g," ").replace(/\s+/g," ").trim() : "";
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
    if (fLimite && ahora < fLimite) {
        return pct >= 90 ? '#e8f8f5' : '#ffffff'; 
    }
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

async function verificarEstadoForo(col, idCurso, pNombre, pId, dCurso) {
    if (!col.urlDirecta) return "No aplica";
    try {
        let r = await fetch(col.urlDirecta);
        if (!r.ok) return "⚠️ Error";
        let text = await r.text();
        let nomProf = (pNombre || "").toLowerCase().trim();
        if (nomProf && text.toLowerCase().includes(nomProf)) {
            return "✅ Participó";
        }
        return "❌ No participó";
    } catch(e) {
        return "⚠️ Error";
    }
}

function iniciarPanelUI(){
    document.body.innerHTML=`<div id="panel-auditoria" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(245,247,250,0.98);z-index:9999;display:flex;justify-content:center;align-items:center;font-family:sans-serif;overflow-y:auto;"><div style="background:white;padding:35px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.1);text-align:center;width:480px;border:1px solid #e1e8ed;max-height:95vh;overflow-y:auto;"><h2 style="background:linear-gradient(135deg,#cc609b,#ff89c9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#cc609b;margin:0 0 10px 0;font-size:26px;font-weight:bold;letter-spacing:-0.5px;">Revisor eCampus (Formación General)</h2><p style="color:#555;font-size:15px;margin:0 0 20px 0;font-weight:bold;">¿Qué deseas hacer?</p><button id="btnGeneral" style="width:100%;background:#27ae60;color:white;border:none;padding:14px;font-size:15px;font-weight:bold;border-radius:8px;cursor:pointer;margin-bottom:20px;transition:0.2s;">🚀 Revisión General de Asignaturas</button><div style="border-top:2px dashed #e1e8ed;margin:20px 0;"></div><h3 style="color:#7f8c8d;font-size:14px;margin-bottom:12px;text-align:left;font-weight:bold;">🔍 Búsqueda Rápida por Estudiante:</h3><input type="email" id="correoEstudiante" placeholder="Correo exacto del estudiante" style="width:100%;padding:11px;box-sizing:border-box;border:2px solid #bdc3c7;border-radius:8px;font-size:13px;margin-bottom:15px;outline:none;"><button id="btnEstudiante" style="width:100%;background:#2980b9;color:white;border:none;padding:14px;font-size:15px;font-weight:bold;border-radius:8px;cursor:pointer;transition:0.2s;">👤 Buscar en Todas las Aulas</button></div></div>`;
    document.getElementById('btnGeneral').addEventListener('click',()=>ejecutarExtractor(null));
    document.getElementById('btnEstudiante').addEventListener('click',()=>{
        let correo=document.getElementById('correoEstudiante').value.trim().toLowerCase();
        if(!correo||!correo.includes('@')){alert("Por favor, ingrese una dirección válida.");return;}
        ejecutarExtractor(correo);
    });
}

async function ejecutarExtractor(estudianteObjetivo){
    let esBusquedaEstudiante = estudianteObjetivo !== null;
    let datosExtraidos = [];
    
    document.body.innerHTML=`<div style='position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:9999;padding:50px;font-family:sans-serif;text-align:center;'><h2>${esBusquedaEstudiante?'🔍 Buscando estudiante...':'REVISANDO ASIGNATURAS'}</h2><div style='width:80%;background:#eee;height:20px;margin:20px auto;border-radius:10px;overflow:hidden;'><div id='p' style='width:0%;background:#2980b9;height:100%;transition:0.3s;'></div></div><p id='s'>Mapeando fechas y estructurando unidades...</p><p id='pct'>0%</p></div>`;
    
    for(let i=0;i<ids.length;i++){
        try{
            await esperar(150);
            
            let r=await fetch(`https://e-campus.uniacc.cl/grade/report/grader/index.php?id=${ids[i]}&perpage=5000&collapsed=0`);
            if(!r.ok) continue;
            
            let textGrader=await r.text();
            if(textGrader.includes("login/index.php")) {
                alert("⚠️ Su sesión de eCampus ha expirado. Por favor inicie sesión nuevamente.");
                location.reload();
                return;
            }

            if(esBusquedaEstudiante && !textGrader.toLowerCase().includes(estudianteObjetivo)){
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
            let rProf=await fetch(`https://e-campus.uniacc.cl/user/index.php?id=${ids[i]}&perpage=5000`);
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

            // BÚSQUEDA Y EXTRACCIÓN DE FECHAS EN PORTADA
            let rCurso = await fetch(`https://e-campus.uniacc.cl/course/view.php?id=${ids[i]}`);
            let dCurso = new DOMParser().parseFromString(rCurso.ok ? await rCurso.text() : "", "text/html");
            
            let fechasSecuenciales = [];
            let mapaActividadUnidad = {}; 
            let mapaActividadFechas = {};

            let secciones = dCurso.querySelectorAll('#accordionEx1 > .card, .course-content li.section, .course-content .section');
            
            secciones.forEach(sec => {
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
                let unidadAsignadaSec = contadorUnidadMapeada > 0 ? contadorUnidadMapeada : 1;
                
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
            
            /* 🔄 DETECCIÓN DE CICLO ACTUALIZADA (SOPORTA AGOSTO Y 2DO SEMESTRE) */
            let cicloAsignatura = "-";
            if (arregloUnidades.length > 0 && arregloUnidades[0].inicio) {
                let fInicioPrimera = parsearFechaMoodle(arregloUnidades[0].inicio);
                if (fInicioPrimera) {
                    let mes = fInicioPrimera.getMonth();
                    if (mes === 2) cicloAsignatura = "1er Ciclo";
                    else if (mes === 4) cicloAsignatura = "2do Ciclo";
                    else if (mes === 7) cicloAsignatura = "3er Ciclo / 2do Semestre";
                    else if (mes === 8) cicloAsignatura = "4to Ciclo / 2do Semestre";
                    else cicloAsignatura = `Ciclo Mes ${mes + 1}`;
                }
            }

            let filaMaestra=Array.from(d.querySelectorAll('table tr')).find(f=>(f.textContent||"").includes("Nombre / Apellido")||(f.textContent||"").includes("Dirección de correo"));
            if(filaMaestra){
                let colValidas=[];
                Array.from(filaMaestra.cells).forEach((celda,idx)=>{
                    let nom=(celda.textContent||"").replace(/Vista única|Ascendente|Descendente|Colapsar|Expandir columna/gi,'').trim().split('\n')[0];
                    let nomMin=nom.toLowerCase();
                    if(/foro|control|evaluaci|examen|sumativa|formativa|tarea|unidad|prueba|cuestionario|final|proyecto|integraci/i.test(nomMin) && !/total|promedio|ad:|diagnostica|diagnóstica|repetición|repeticion|nota final|calificaci[oó]n final/i.test(nomMin)){
                        let linkActividad=celda.querySelector('a[href*="mod/"]');
                        let actId = null;
                        if (linkActividad) {
                            let matchId = linkActividad.href.match(/id=(\d+)/);
                            if (matchId) actId = matchId[1];
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
                            let statusForo="No aplica";
                            if(/foro/i.test(col.nom)) statusForo=await verificarEstadoForo(col,ids[i],pNombre,pId, dCurso);
                            
                            let unidadAsignada = asignarUnidad(col.nom, colValidas.indexOf(col), arregloUnidades.length, col.actId, mapaActividadUnidad);
                            let nombreCorto = generarNombreCorto(col.nom, unidadAsignada);

                            let fechaAperturaEsp = col.actId && mapaActividadFechas[col.actId] ? mapaActividadFechas[col.actId].apertura : null;
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
                            let statusForo="No aplica";
                            if(/foro/i.test(col.nom)) statusForo=await verificarEstadoForo(col,ids[i],pNombre,pId, dCurso);
                            
                            let unidadAsignada = asignarUnidad(col.nom, colValidas.indexOf(col), arregloUnidades.length, col.actId, mapaActividadUnidad);
                            let nombreCorto = generarNombreCorto(col.nom, unidadAsignada);

                            let fechaAperturaEsp = col.actId && mapaActividadFechas[col.actId] ? mapaActividadFechas[col.actId].apertura : null;
                            let fechaCierreEsp = col.actId && mapaActividadFechas[col.actId] ? mapaActividadFechas[col.actId].cierre : null;

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
                                    let fInicioObj = parsearFechaMoodle(uObj.inicio);
                                    if (fInicioObj) {
                                        let diasExtra = (totalUn === 4) ? 14 : 35;
                                        fLimite = new Date(fInicioObj.getTime() + (diasExtra * 24 * 60 * 60 * 1000));
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
                        
                        if(listaPendientesMaestra.length > 0 && pCorreo.includes('@')) {
                            let subjTodo = encodeURIComponent(`Recordatorio de Pendientes Urgentes - ${nombreCurso}`);
                            let intro = encodeURIComponent(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo para comunicarle que la plataforma registra las siguientes actividades pendientes por regularizar en la asignatura ${nombreCurso}:\n\n${listaPendientesMaestra.join('\n')}`);
                            let detalles = encodeURIComponent(tieneNotasParaTodoPendiente ? `\n\nActividades con calificaciones pendientes:${resumenNotasTodoPendiente}` : '');
                            let explicacion = encodeURIComponent(tieneNotasParaTodoPendiente ? `\n\n${textoExplicacionCeros}` : '');
                            let despedida = encodeURIComponent(`\n\nLe recordamos la importancia de mantener estas actividades al día para el correcto seguimiento de nuestros estudiantes.\n\nQuedo atento/a ante cualquier duda o inconveniente técnico.\n\nSaludos cordiales.`);
                            
                            arrayBotones.push(`<button onclick="window.enviarCorreoSeguro('${pCorreo}', '${subjTodo}', '${intro}', '${detalles}', '${explicacion}', '${despedida}')" style="display:inline-block;width:100px;padding:6px;background:#34495e;color:white;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;border:1px solid #2c3e50;cursor:pointer;">✉️ Todo Pendiente</button>`);
                            arrayBotones.push(`<div style="height:4px; border-bottom:1px dashed #ccc; margin-bottom:4px;"></div>`);
                        }
                        if(cursoFaltanNotas && pCorreo.includes('@')) {
                            let subjNotas = encodeURIComponent(`Pendiente ingreso de calificaciones - ${nombreCurso}`);
                            let intro = encodeURIComponent(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo para recordarle que existen calificaciones pendientes por ingresar en la asignatura ${nombreCurso}:`);
                            let detalles = encodeURIComponent(`\n${resumenNotasFaltantes}`);
                            let explicacion = encodeURIComponent(`\n\n${textoExplicacionCeros}`);
                            let despedida = encodeURIComponent(`\n\nQuedo atento/a ante cualquier duda o problema con la plataforma.\n\nSaludos cordiales.`);
                            
                            arrayBotones.push(`<button onclick="window.enviarCorreoSeguro('${pCorreo}', '${subjNotas}', '${intro}', '${detalles}', '${explicacion}', '${despedida}')" style="display:inline-block;width:100px;padding:6px;background:#e67e22;color:white;border:none;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;cursor:pointer;">✉️ Faltan Notas</button>`);
                        }
                        if(cursoFaltaForo && pCorreo.includes('@')) {
                            let subjForo = encodeURIComponent(`Pendiente participación en foros - ${nombreCurso}`);
                            let intro = encodeURIComponent(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo para recordarle que se encuentra pendiente su participación/moderación en los foros de la asignatura ${nombreCurso}.`);
                            let despedida = encodeURIComponent(`\n\nQuedo atento/a ante cualquier duda o consulta.\n\nSaludos cordiales.`);
                            arrayBotones.push(`<button onclick="window.enviarCorreoSeguro('${pCorreo}', '${subjForo}', '${intro}', '', '', '${despedida}')" style="display:inline-block;width:100px;padding:6px;background:#2980b9;color:white;border:none;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;cursor:pointer;margin-top:3px;">✉️ Foro Pendiente</button>`);
                        }
                        
                        cursoObj.arrayBotones = arrayBotones;
                        datosExtraidos.push(cursoObj);
                    }
                }
            }
        }catch(e){
            console.error("Error procesando aula "+ids[i], e);
        }
    }

    renderizarResultados(datosExtraidos, esBusquedaEstudiante);
}

function renderizarResultados(datos, esBusquedaEstudiante) {
    if(!datos || datos.length === 0) {
        alert("⚠️ No se encontraron resultados para las asignaturas configuradas o el estudiante buscado.");
        location.reload();
        return;
    }

    let html = `<div style="padding:20px;font-family:sans-serif;background:#f4f6f9;min-height:100vh;">
        <h2 style="color:#2c3e50;">Resultados de la Auditoría (${datos.length} registro/s)</h2>
        <button onclick="location.reload()" style="padding:10px 15px;background:#7f8c8d;color:white;border:none;border-radius:6px;cursor:pointer;margin-bottom:20px;font-weight:bold;">🔄 Volver a Inicio</button>`;

    datos.forEach(c => {
        html += `<div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:20px;border-left:5px solid #2980b9;">
            <h3 style="margin:0 0 10px 0;color:#2c3e50;">${c.linkAsignatura} <span style="font-size:13px;color:#7f8c8d;font-weight:normal;">(${c.cicloAsignatura})</span></h3>
            ${c.pNombre ? `<p style="margin:0 0 10px 0;font-size:13px;"><b>Docente:</b> ${c.pNombre} | <b>Correo:</b> ${c.pCorreo || 'N/A'} | <b>Acceso:</b> <span style="color:${c.cAcceso}">${c.pAcceso}</span></p>` : ''}
            <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
                <thead>
                    <tr style="background:#ecf0f1;color:#2c3e50;">
                        <th style="padding:8px;border:1px solid #ddd;">Evaluación</th>
                        <th style="padding:8px;border:1px solid #ddd;">Fechas</th>
                        ${esBusquedaEstudiante ? '<th style="padding:8px;border:1px solid #ddd;">Nota</th>' : '<th style="padding:8px;border:1px solid #ddd;">Sin Nota / Total</th><th style="padding:8px;border:1px solid #ddd;">Rendimiento</th>'}
                        <th style="padding:8px;border:1px solid #ddd;">Estado Foro</th>
                    </tr>
                </thead>
                <tbody>`;
        c.items.forEach(it => {
            html += `<tr>
                <td style="padding:8px;border:1px solid #ddd;"><b>${it.colNom}</b></td>
                <td style="padding:8px;border:1px solid #ddd;">${it.fechasStr}</td>
                ${esBusquedaEstudiante ? 
                    `<td style="padding:8px;border:1px solid #ddd;"><b>${it.notaTexto}</b></td>` : 
                    `<td style="padding:8px;border:1px solid #ddd;">${it.faltan > 0 ? `<button onclick="window.mostrarEstudiantesSinNota('${encodeURIComponent(it.estudiantesSinNota.join('||'))}')" style="background:#e74c3c;color:white;border:none;border-radius:4px;padding:3px 7px;cursor:pointer;font-size:11px;font-weight:bold;">${it.faltan} faltan</button>` : '✅ Al día'} / ${it.totalAlumnos}</td>
                     <td style="padding:8px;border:1px solid #ddd;background:${obtenerColorRendimiento(it.rendimiento, it.fLimite)}"><b>${it.rendimiento}%</b></td>`
                }
                <td style="padding:8px;border:1px solid #ddd;">${it.statusForo}</td>
            </tr>`;
        });
        html += `</tbody></table>`;
        if(c.arrayBotones && c.arrayBotones.length > 0) {
            html += `<div style="margin-top:15px;display:flex;gap:10px;align-items:center;"><b>Notificar Docente:</b> ${c.arrayBotones.join(' ')}</div>`;
        }
        html += `</div>`;
    });

    html += `</div>`;
    document.body.innerHTML = html;
}

/* Iniciar la interfaz directamente */
iniciarPanelUI();
