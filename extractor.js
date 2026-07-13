(async function(){
/* 👇 TODOS TUS IDs CARGADOS 👇 */
const ids=[51014, 51063, 51098, 51122, 51181, 53631, 51015, 51064, 51099, 51123, 51147, 53632, 51016, 51065, 51100, 51148, 51183, 53633, 51017, 51066, 51101, 51125, 51149, 53634, 51018, 51067, 51150, 51174, 51185, 53635, 51019, 51020, 51021, 51022, 51023, 51024, 51073, 51103, 51151, 51175, 51025, 51074, 51104, 51128, 51152, 51026, 51075, 51105, 51153, 51177, 51027, 51106, 51130, 51154, 51178, 51028, 51077, 51107, 51131, 51155, 51029, 51078, 51030, 51079, 51031, 51080, 51032, 51081, 51033, 51082, 51034, 51083, 51108, 51132, 51035, 51084, 51109, 51133, 51036, 51085, 51110, 51134, 51037, 51086, 51111, 51135, 51038, 51087, 51112, 51136, 51039, 51040, 51041, 51042, 51043, 51044, 51088, 51113, 51137, 51045, 51089, 51114, 51138, 51046, 51090, 51115, 51139, 51047, 51091, 51116, 51164, 51092, 51117, 51141, 51165, 51049, 51050, 51051, 51052, 51053, 51055, 51094, 51119, 51143, 51167, 51056, 51095, 51120, 51144, 51168, 51057, 51096, 51121, 51145];
/* 👆 TODOS TUS IDs CARGADOS 👆 */

const coloresPastel=['#ffffff', '#fcfcfc'];

function normalizarTexto(t){
    return t?t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g," ").replace(/\s+/g," ").trim():"";
}

function parsearFechaMoodle(texto) {
    if (!texto || /cierre/i.test(texto)) return null;
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

/* 👇 NUEVO ASIGNADOR INTELIGENTE DE UNIDADES 👇 */
function asignarUnidad(nom, idxCol, totalUnidades) {
    // Si la evaluación es "final", "proyecto", "examen", se ancla a la ÚLTIMA unidad detectada
    if (/final|proyecto|integraci/i.test(nom)) return totalUnidades || 1;
    let numNombre = obtenerNumeroUnidad(nom);
    if (numNombre !== null && numNombre <= totalUnidades && numNombre > 0) return numNombre;
    return (idxCol !== -1 && idxCol < totalUnidades) ? idxCol + 1 : (totalUnidades || 1);
}

function obtenerColorRendimiento(pct, textoTermino) {
    let ahora = new Date();
    let fechaTermino = parsearFechaMoodle(textoTermino);
    if (fechaTermino) {
        let fechaLimite = new Date(fechaTermino.getTime() + (7 * 24 * 60 * 60 * 1000));
        if (ahora < fechaLimite) {
            return pct >= 90 ? '#e8f8f5' : '#ffffff'; 
        }
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

function iniciarPanelUI(){
    document.body.innerHTML=`<div id="panel-auditoria" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(245,247,250,0.98);z-index:9999;display:flex;justify-content:center;align-items:center;font-family:sans-serif;overflow-y:auto;"><div style="background:white;padding:35px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.1);text-align:center;width:480px;border:1px solid #e1e8ed;max-height:95vh;overflow-y:auto;"><h2 style="background:linear-gradient(135deg,#cc609b,#ff89c9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#cc609b;margin:0 0 10px 0;font-size:26px;font-weight:bold;letter-spacing:-0.5px;">Revisor eCampus (Láser Consolidado)</h2><p style="color:#555;font-size:15px;margin:0 0 20px 0;font-weight:bold;">¿Qué deseas hacer?</p><button id="btnGeneral" style="width:100%;background:#27ae60;color:white;border:none;padding:14px;font-size:15px;font-weight:bold;border-radius:8px;cursor:pointer;margin-bottom:20px;transition:0.2s;">🚀 Auditoría General</button><div style="border-top:2px dashed #e1e8ed;margin:20px 0;"></div><h3 style="color:#7f8c8d;font-size:14px;margin-bottom:12px;text-align:left;font-weight:bold;">🔍 Búsqueda Rápida por Estudiante:</h3><input type="email" id="correoEstudiante" placeholder="Correo exacto del alumno" style="width:100%;padding:11px;box-sizing:border-box;border:2px solid #bdc3c7;border-radius:8px;font-size:13px;margin-bottom:15px;outline:none;"><button id="btnEstudiante" style="width:100%;background:#2980b9;color:white;border:none;padding:14px;font-size:15px;font-weight:bold;border-radius:8px;cursor:pointer;transition:0.2s;">👤 Buscar en Todas las Aulas</button></div></div>`;
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
    
    document.body.innerHTML=`<div style='position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:9999;padding:50px;font-family:sans-serif;text-align:center;'><h2>${esBusquedaEstudiante?'🔍 Buscando estudiante...':'🚀 Extractor General Activo'}</h2><div style='width:80%;background:#eee;height:20px;margin:20px auto;border-radius:10px;overflow:hidden;'><div id='p' style='width:0%;background:#2980b9;height:100%;transition:0.3s;'></div></div><p id='s'>Mapeando fechas homologadas por Unidad...</p><p id='pct'>0%</p></div>`;
    
    for(let i=0;i<ids.length;i++){
        try{
            let r=await fetch(`https://e-campus.uniacc.cl/grade/report/grader/index.php?id=${ids[i]}`);
            let textGrader=await r.text();
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
            
            let pNombre="No asignado",pCorreo="No disponible",pAcceso="Nunca ha ingresado",pId=null;
            let rProf=await fetch(`https://e-campus.uniacc.cl/user/index.php?id=${ids[i]}&perpage=5000`);
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

            let rCurso = await fetch(`https://e-campus.uniacc.cl/course/view.php?id=${ids[i]}`);
            let dCurso = new DOMParser().parseFromString(await rCurso.text(), "text/html");
            
            let fechasSecuenciales = [];
            let todosLosBloquesFechas = dCurso.querySelectorAll('.availabilityinfo, .section_availability, [data-region="availabilityinfo"], .isrestricted');
            
            todosLosBloquesFechas.forEach(el => {
                let textoEl = el.textContent.replace(/\s+/g, ' ');
                if (textoEl.toLowerCase().includes("disponible desde")) {
                    let fecha = "";
                    let strong = el.querySelector('strong');
                    if (strong) {
                        fecha = strong.textContent.trim();
                    } else {
                        let match = textoEl.match(/disponible desde\s+([a-z0-9\sde]+)/i);
                        if (match && match[1]) fecha = match[1].trim();
                    }
                    if (fecha && !fechasSecuenciales.includes(fecha)) {
                        fechasSecuenciales.push(fecha);
                    }
                }
            });

            if (fechasSecuenciales.length === 0) {
                dCurso.querySelectorAll('div, span, p, li, strong').forEach(el => {
                    if (el.children.length === 0 || (el.children.length === 1 && el.querySelector('strong'))) {
                        let txt = el.textContent.replace(/\s+/g, ' ');
                        if (txt.toLowerCase().includes("disponible desde")) {
                            let strong = el.querySelector('strong');
                            let fecha = strong ? strong.textContent.trim() : "";
                            if (!fecha) {
                                let match = txt.match(/disponible desde\s+([a-z0-9\sde]+)/i);
                                if (match && match[1]) fecha = match[1].trim();
                            }
                            if (fecha && !fechasSecuenciales.includes(fecha)) {
                                fechasSecuenciales.push(fecha);
                            }
                        }
                    }
                });
            }

            let arregloUnidades = [];
            for (let idx = 0; idx < fechasSecuenciales.length; idx++) {
                let inicio = fechasSecuenciales[idx];
                let termino = (idx + 1 < fechasSecuenciales.length) ? fechasSecuenciales[idx + 1] : "Cierre del curso";
                arregloUnidades.push({
                    numeroUnidad: idx + 1,
                    inicio: inicio,
                    termino: termino
                });
            }
            
            let filaMaestra=Array.from(d.querySelectorAll('table tr')).find(f=>(f.textContent||"").includes("Nombre / Apellido")||(f.textContent||"").includes("Dirección de correo"));
            if(filaMaestra){
                let colValidas=[];
                Array.from(filaMaestra.cells).forEach((celda,idx)=>{
                    let nom=(celda.textContent||"").replace(/Vista única|Ascendente|Descendente|Colapsar|Expandir columna/gi,'').trim().split('\n')[0];
                    let nomMin=nom.toLowerCase();
                    // 👇 SE AMPLIÓ EL FILTRO PARA ATRAPAR ACTIVIDADES FINALES 👇
                    if(/foro|control|evaluaci|examen|sumativa|formativa|tarea|unidad|prueba|cuestionario|final|proyecto|integraci/i.test(nomMin) && !/total|promedio|ad:|diagnostica|diagnóstica/i.test(nomMin)){
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
                        let cursoObj = { nombreCurso, pNombre, items: [] };
                        for(let indiceColumna=0;indiceColumna<colValidas.length;indiceColumna++){
                            let col=colValidas[indiceColumna];
                            let rawNota=filaEstudiante.cells[col.idx]?.textContent||"-";
                            let notaTexto=rawNota.replace(/Acciones de la celda|Análisis de calificaciones|Ver retroalimentación/gi,'').trim()||"-";
                            let statusForo="No aplica";
                            if(/foro/i.test(col.nom)) statusForo=await verificarEstadoForo(col,ids[i],pNombre,pId, dCurso);
                            
                            let unidadAsignada = asignarUnidad(col.nom, colValidas.indexOf(col), arregloUnidades.length);
                            let fechasStr = "No especificada";
                            if (arregloUnidades[unidadAsignada - 1]) {
                                let uObj = arregloUnidades[unidadAsignada - 1];
                                fechasStr = `<b>Inicio:</b> ${uObj.inicio}<br><b>Término:</b> ${uObj.termino}`;
                            }

                            cursoObj.items.push({ colNom: col.nom, statusForo, notaTexto, fechasStr });
                        }
                        if(cursoObj.items.length > 0) datosExtraidos.push(cursoObj);
                    }
                }else{
                    let filasAImprimir = [];
                    for(let col of colValidas){
                        let faltan=0,totalAlumnos=0;
                        filasDatos.forEach(row=>{
                            if(row.querySelector('a[href*="user/view.php"], a[href*="user/profile.php"]')){
                                totalAlumnos++;
                                let nota=parseFloat((row.cells[col.idx]?.textContent||"").replace(/[^\d,\.-]/g,'').replace(',','.'));
                                if(isNaN(nota)||nota<1.0||nota>7.0)faltan++;
                            }
                        });
                        if(totalAlumnos>0){
                            let statusForo="No aplica";
                            if(/foro/i.test(col.nom)) statusForo=await verificarEstadoForo(col,ids[i],pNombre,pId, dCurso);
                            
                            let unidadAsignada = asignarUnidad(col.nom, colValidas.indexOf(col), arregloUnidades.length);
                            let fechasStr = "No especificada";
                            let textoTermino = "Cierre del curso";
                            if (arregloUnidades[unidadAsignada - 1]) {
                                let uObj = arregloUnidades[unidadAsignada - 1];
                                fechasStr = `<b>Inicio:</b> ${uObj.inicio}<br><b>Término:</b> ${uObj.termino}`;
                                textoTermino = uObj.termino;
                            }

                            filasAImprimir.push({
                                colNom: col.nom, statusForo: statusForo, faltan: faltan,
                                totalAlumnos: totalAlumnos, rendimiento: Math.round((totalAlumnos-faltan)/totalAlumnos*100),
                                fechasStr: fechasStr, textoTermino: textoTermino
                            });
                        }
                    }
                    
                    if(filasAImprimir.length > 0) {
                        let cAcceso = configurarColorAcceso(pAcceso);
                        let cursoObj = { nombreCurso, pNombre, pCorreo, pAcceso, cAcceso, items: filasAImprimir };

                        let cursoFaltanNotas = filasAImprimir.some(item => {
                            if(item.faltan === 0) return false;
                            let fTermino = parsearFechaMoodle(item.textoTermino);
                            if(fTermino){
                                let fLimite = new Date(fTermino.getTime() + (7 * 24 * 60 * 60 * 1000));
                                if(new Date() < fLimite) return false; 
                            }
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

                        let arrayBotones = [];
                        let listaPendientesMaestra = [];

                        if(sinAcceso7Dias) listaPendientesMaestra.push("- Regularizar su acceso a la plataforma (registra alerta de inactividad).");
                        if(cursoFaltaForo) listaPendientesMaestra.push("- Participación, respuesta o moderación en los foros de discusión.");
                        if(cursoFaltanNotas) listaPendientesMaestra.push("- Ingreso de calificaciones pendientes en el libro de notas (plazo de una semana cumplido).");

                        if(listaPendientesMaestra.length > 0 && pCorreo.includes('@')) {
                            let subjTodo = encodeURIComponent(`Recordatorio de Pendientes Urgentes - ${nombreCurso}`);
                            let bodyTodo = encodeURIComponent(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo para comunicarle que la plataforma registra las siguientes actividades pendientes por regularizar en la asignatura ${nombreCurso}:\n\n${listaPendientesMaestra.join('\n')}\n\nLe recordamos la importancia de mantener estas actividades al día para el correcto seguimiento de nuestros estudiantes.\n\nQuedo atento/a ante cualquier duda o inconveniente técnico.\n\nSaludos cordiales.`);
                            arrayBotones.push(`<a href="mailto:${pCorreo}?subject=${subjTodo}&body=${bodyTodo}" style="display:inline-block;width:100px;padding:6px;background:#34495e;color:white;text-decoration:none;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;border:1px solid #2c3e50;">✉️ Todo Pendiente</a>`);
                            arrayBotones.push(`<div style="height:4px; border-bottom:1px dashed #ccc; margin-bottom:4px;"></div>`);
                        }

                        if(cursoFaltanNotas && pCorreo.includes('@')) {
                            let subjNotas = encodeURIComponent(`Pendiente ingreso de calificaciones - ${nombreCurso}`);
                            let bodyNotas = encodeURIComponent(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo para recordarle que existen calificaciones pendientes por ingresar en la asignatura ${nombreCurso}.\n\nQuedo atento/a ante cualquier duda o problema con la plataforma.\n\nSaludos cordiales.`);
                            arrayBotones.push(`<a href="mailto:${pCorreo}?subject=${subjNotas}&body=${bodyNotas}" style="display:inline-block;width:100px;padding:6px;background:#e67e22;color:white;text-decoration:none;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;">✉️ Faltan Notas</a>`);
                        }
                        if(cursoFaltaForo && pCorreo.includes('@')) {
                            let subjForo = encodeURIComponent(`Pendiente participación en foros - ${nombreCurso}`);
                            let bodyForo = encodeURIComponent(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo para recordarle que se encuentra pendiente su participación/moderación en los foros de la asignatura ${nombreCurso}.\n\nQuedo atento/a ante cualquier duda o problema con la plataforma.\n\nSaludos cordiales.`);
                            arrayBotones.push(`<a href="mailto:${pCorreo}?subject=${subjForo}&body=${bodyForo}" style="display:inline-block;width:100px;padding:6px;background:#c0392b;color:white;text-decoration:none;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;">✉️ Falta Foro</a>`);
                        }
                        if(sinAcceso7Dias && pCorreo.includes('@')) {
                            let subjAcceso = encodeURIComponent(`Alerta de inactividad - ${nombreCurso}`);
                            let bodyAcceso = encodeURIComponent(`Estimado/a ${pNombre},\n\nJunto con saludar, le escribo debido a que el sistema registra que no ha ingresado a la plataforma por 7 días o más en la asignatura ${nombreCurso}.\n\nLe recordamos la importancia de mantener una revisión constante para el buen desarrollo del curso.\n\nQuedo atento/a ante cualquier inconveniente técnico o personal.\n\nSaludos cordiales.`);
                            arrayBotones.push(`<a href="mailto:${pCorreo}?subject=${subjAcceso}&body=${bodyAcceso}" style="display:inline-block;width:100px;padding:6px;background:#8e44ad;color:white;text-decoration:none;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;">✉️ Sin Acceso</a>`);
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
        <h2 style='color:${esBusquedaEstudiante?'#2980b9':'#27ae60'}; margin:0;'>${esBusquedaEstudiante?'👤 Historial: '+estudianteObjetivo:'✅ Auditoría Consolidada'}</h2>
        <div>
            <button id="btnExportar" style="padding:10px 15px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin-right:10px; transition:0.2s;">📥 Exportar Excel</button>
            <button onclick='location.reload()' style='padding:10px 15px; background:#7f8c8d; color:white; border:none; border-radius:6px; cursor:pointer; transition:0.2s;'>⬅️ Volver</button>
        </div>
    </div>`;

    let titulosColumnas = esBusquedaEstudiante 
        ? ['Asignatura', 'Docente', 'Fechas Homologadas', 'Evaluación', 'Nota'] 
        : ['Asignatura', 'Docente', 'Correo', 'Último Acceso', 'Acciones Consolidadas', 'Fechas Homologadas', 'Evaluación', '¿Docente Participó?', 'Faltan', 'Alumnos', 'Rendimiento'];

    let theadCompleto = `
    <thead style='background:${esBusquedaEstudiante?'#2980b9':'#27ae60'};color:white;position:sticky;top:0;z-index:10;'>
        <tr>${titulosColumnas.map(t => `<th style='padding:10px;border:1px solid #bdc3c7;'>${t}</th>`).join('')}</tr>
        <tr class="fila-filtros" style="background:#eaeded;">
            ${titulosColumnas.map((_, i) => {
                if(!esBusquedaEstudiante && i === 4) return `<th style='padding:4px;border:1px solid #bdc3c7;'><input class="filtro-col" disabled type="text" style="width:100%;box-sizing:border-box;font-size:11px;padding:5px;border:1px solid #ccc;border-radius:4px;background:#ddd;cursor:not-allowed;"></th>`;
                return `<th style='padding:4px;border:1px solid #bdc3c7;'><input class="filtro-col" type="text" placeholder="Filtrar..." style="width:100%;box-sizing:border-box;font-size:11px;padding:5px;border:1px solid #ccc;border-radius:4px;outline:none;"></th>`;
            }).join('')}
        </tr>
    </thead>`;

    document.body.innerHTML=`<div style='padding:20px; font-family:sans-serif;'>${cabeceraSuperior}<div style='overflow-x:auto; max-height:85vh; border:1px solid #bdc3c7; box-shadow:0 5px 15px rgba(0,0,0,0.05);'><table id='tablaAuditoria' style='border-collapse:collapse;width:100%;font-size:12px;'>${theadCompleto}<tbody></tbody></table></div></div>`;

    document.querySelectorAll('.filtro-col').forEach(input => {
        input.addEventListener('input', renderTabla);
    });

    const btnExp = document.getElementById('btnExportar');
    if (btnExp) {
        btnExp.onclick = () => {
            let table = document.getElementById('tablaAuditoria');
            let htmlTable = table.outerHTML;
            htmlTable = htmlTable.replace(/<input[^>]*>/gi, '');
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
                    if(inputs[1] && !curso.pNombre.toLowerCase().includes(inputs[1])) return false;
                    if(inputs[2] && !item.fechasStr.toLowerCase().includes(inputs[2])) return false;
                    if(inputs[3] && !(item.colNom + " " + item.statusForo).toLowerCase().includes(inputs[3])) return false;
                    if(inputs[4] && !item.notaTexto.toLowerCase().includes(inputs[4])) return false;
                    return true;
                } else {
                    if(inputs[0] && !curso.nombreCurso.toLowerCase().includes(inputs[0])) return false;
                    if(inputs[1] && !curso.pNombre.toLowerCase().includes(inputs[1])) return false;
                    if(inputs[2] && !curso.pCorreo.toLowerCase().includes(inputs[2])) return false;
                    if(inputs[3] && !curso.pAcceso.toLowerCase().includes(inputs[3])) return false;
                    if(inputs[5] && !item.fechasStr.toLowerCase().includes(inputs[5])) return false;
                    if(inputs[6] && !item.colNom.toLowerCase().includes(inputs[6])) return false;
                    if(inputs[7] && !item.statusForo.toLowerCase().includes(inputs[7])) return false;
                    if(inputs[8] && !item.faltan.toString().includes(inputs[8])) return false;
                    if(inputs[9] && !item.totalAlumnos.toString().includes(inputs[9])) return false;
                    if(inputs[10] && !(item.rendimiento+"%").includes(inputs[10])) return false;
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
                            html += `<td rowspan="${rs}" style='padding:12px;border:1px solid #bdc3c7;${estiloSeparador}font-weight:bold;'>${curso.nombreCurso}</td>
                                     <td rowspan="${rs}" style='padding:12px;border:1px solid #bdc3c7;${estiloSeparador}font-weight:bold;'>${curso.pNombre}</td>`;
                        } else {
                            html += `<td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}'>${curso.nombreCurso}</td>
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
                        let bgRendimiento = obtenerColorRendimiento(it.rendimiento, it.textoTermino);
                        html += `<td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}font-size:11px;'>${it.fechasStr}</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}'>${it.colNom}</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;'>${it.statusForo}</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;font-weight:bold;color:${it.faltan>0?"#c0392b":"#27ae60"};'>${it.faltan}</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;'>${it.totalAlumnos}</td>
                                 <td style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}text-align:center;font-weight:bold;background-color:${bgRendimiento};'>${it.rendimiento}%</td>
                                 </tr>`;
                    }
                }
            }
        }
        document.querySelector('#tablaAuditoria tbody').innerHTML = html;
    }
    
    renderTabla();
}

/* 👇 EXACTA LÓGICA DE FOROS DE TU ARCHIVO 👇 */
async function verificarEstadoForo(col,idCurso,pNombre,pId, dCursoPreload){
    let urlForoObjetivo=col.urlDirecta&&(col.urlDirecta.includes("mod/forum/view.php")||col.urlDirecta.includes("mod/forum/discuss.php"))?col.urlDirecta:null;
    if(!urlForoObjetivo || !urlForoObjetivo.includes("forum")){
        try{
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
                        if (!tituloForo.includes("ad a traves") && !tituloForo.includes("ad ") && !tituloForo.includes("diagnostica") && !tituloForo.includes("duda") && !tituloForo.includes("aviso") && !tituloForo.includes("presenta")) {
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
        }catch(e){console.error("Error al rastrear unidad", e)}
    }
    
    if(!urlForoObjetivo) return "<span style='color:#d35400;'>⚠️ No link</span>";
    let linkDebug = `<br><a href="${urlForoObjetivo}" target="_blank" style="font-size:10px;color:#3498db;text-decoration:none;">🔗 Ver foro</a>`;

    try{
        let rForo=await fetch(urlForoObjetivo);
        let rawHtmlForo = await rForo.text();
        let profeEncontrado = false;
        let estudiantes = new Set();

        if (pId && (rawHtmlForo.includes(`id=${pId}&`) || rawHtmlForo.includes(`id=${pId}"`) || rawHtmlForo.includes(`userid":${pId}`) || rawHtmlForo.includes(`userid":"${pId}"`))) profeEncontrado = true;

        let dForo = new DOMParser().parseFromString(rawHtmlForo,"text/html");
        function escanearDoc(doc) {
            doc.querySelectorAll('aside, nav, header, footer, #block-region-side-pre, #block-region-side-post, .block, .navbar').forEach(el => el.remove());
            let main = doc.querySelector('#region-main, [role="main"], #maincontent, .course-content') || doc.body;

            if(pId && main.innerHTML.includes(`id=${pId}`)) profeEncontrado = true;

            doc.querySelectorAll('.forumpost, article.forum-post, tr.discussion, .discussion-list-item, td.author, a[href*="user/view.php"]').forEach(post => {
                let html = post.innerHTML || "";
                if (pId && html.includes(`id=${pId}`)) profeEncontrado = true;

                let imgAutor = post.querySelector('img.userpicture');
                let linkAutor = post.tagName.toLowerCase() === 'a' ? post : post.querySelector('a[href*="user/view.php"], a[href*="user/profile.php"]');
                
                if(imgAutor || linkAutor){
                    let n = ((linkAutor ? linkAutor.textContent : "") || (imgAutor ? imgAutor.getAttribute('alt') : "") || "").replace(/Imagen de /gi, "").trim();
                    if(n.length > 3 && !n.toLowerCase().includes('profesor') && !n.toLowerCase().includes('docente')) estudiantes.add(n);
                }
            });
        }
        escanearDoc(dForo);

        if(!profeEncontrado) {
            let linksDebates = Array.from(dForo.querySelectorAll('a[href*="discuss.php?d="]')).map(a => a.href.split('#')[0]);
            let linksUnicos = [...new Set(linksDebates)].slice(0, 8); 

            for(let link of linksUnicos) {
                if(profeEncontrado) break; 
                try {
                    let rDeb = await fetch(link);
                    let textDeb = await rDeb.text();
                    if (pId && (textDeb.includes(`id=${pId}`) || textDeb.includes(`userid":${pId}`) || textDeb.includes(`userid":"${pId}"`))) {
                        profeEncontrado = true; break;
                    }
                    let docDeb = new DOMParser().parseFromString(textDeb, "text/html");
                    escanearDoc(docDeb);
                } catch(e){}
            }
        }

        if(profeEncontrado) return `<span style='color:#27ae60;font-weight:bold;'>✅ Sí</span>${linkDebug}`;
        
        let arrEstudiantes = Array.from(estudiantes);
        if(arrEstudiantes.length === 0) return `<span style='color:#c0392b;font-weight:bold;'>❌ No</span><br><small style='font-size:10px;color:#888;'>Sin discusiones</small>${linkDebug}`;
        
        let muestra = arrEstudiantes.slice(0, 2).join(', ');
        if(arrEstudiantes.length > 2) muestra += '...';
        return `<span style='color:#c0392b;font-weight:bold;'>❌ No</span><br><small style='font-size:10px;color:#888;'>Alumnos: ${muestra}</small>${linkDebug}`;
        
    }catch(e){return "<span style='color:#7f8c8d;'>⚠️ Error</span>";}
}

iniciarPanelUI();
})();
