(async function(){
    /* =========================================================
       📢 CONTROL CENTRAL de IDs (Modifica esta lista cuando quieras)
       ========================================================= */
    const ids = [51014, 51063, 51098, 51122];
    
    /* =========================================================
       ⚙️ LÓGICA DEL MOTOR (Inalterable para los usuarios)
       ========================================================= */
    const coloresPastel = ['#ffffff', '#fcfcfc'];

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

    function obtenerColorRendimiento(pct, textoTermino) {
        let ahora = new Date();
        let fechaTermino = parsearFechaMoodle(textoTermino);
        if (fechaTermino) {
            let fechaLimite = new Date(fechaTermino.getTime() + (7 * 24 * 60 * 60 * 1000));
            if (ahora < fechaLimite) return '#e8f8f5'; 
        }
        if (pct < 50) return '#fadbd8';  
        if (pct < 90) return '#fdebd0';  
        return '#e8f8f5';               
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
                        if (strong) fecha = strong.textContent.trim();
                        if (fecha && !fechasSecuenciales.includes(fecha)) fechasSecuenciales.push(fecha);
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
                
                let filaMaestra=Array.from(d.querySelectorAll('table tr')).find(f=>(f.textContent||"").includes("Nombre / Apellido")||(f.textContent||"").includes("Dirección de correo"));
                if(filaMaestra){
                    let colValidas=[];
                    Array.from(filaMaestra.cells).forEach((celda,idx)=>{
                        let nom=(celda.textContent||"").replace(/Vista única|Ascendente|Descendente|Colapsar|Expandir columna/gi,'').trim().split('\n')[0];
                        let nomMin=nom.toLowerCase();
                        if(/foro|control|evaluaci|examen|sumativa|formativa|tarea|unidad|prueba|cuestionario/i.test(nomMin) && !/total|promedio|ad:|diagnostica|diagnóstica/i.test(nomMin)){
                            let linkActividad=celda.querySelector('a[href*="mod/"]');
                            colValidas.push({idx:idx,nom:nom,urlDirecta:linkActividad?linkActividad.href:null});
                        }
                    });
                    
                    let filasDatos=d.querySelectorAll('table tbody tr');
                    
                    if(esBusquedaEstudiante){
                        let filaEstudiante=Array.from(filasDatos).find(row=>(row.innerHTML.toLowerCase().includes(estudianteObjetivo))||(row.textContent||"").toLowerCase().includes(estudianteObjetivo));
                        if(filaEstudiante&&colValidas.length>0){
                            let cursoObj = { nombreCurso, pNombre, items: [] };
                            for(let col of colValidas){
                                let rawNota=filaEstudiante.cells[col.idx]?.textContent||"-";
                                let notaTexto=rawNota.replace(/Acciones de la celda|Análisis de calificaciones|Ver retroalimentación/gi,'').trim()||"-";
                                let statusForo="No aplica";
                                if(/foro/i.test(col.nom)) statusForo=await verificarEstadoForo(col,ids[i],pNombre,pId, dCurso);
                                
                                let unidadAsignada = obtenerNumeroUnidad(col.nom) || (colValidas.indexOf(col) + 1);
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
                                
                                let unidadAsignada = obtenerNumeroUnidad(col.nom) || (colValidas.indexOf(col) + 1);
                                let fechasStr = "No especificada", textoTermino = "Cierre del curso";
                                if (arregloUnidades[unidadAsignada - 1]) {
                                    fechasStr = `<b>Inicio:</b> ${arregloUnidades[unidadAsignada - 1].inicio}<br><b>Término:</b> ${arregloUnidades[unidadAsignada - 1].termino}`;
                                    textoTermino = arregloUnidades[unidadAsignada - 1].termino;
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
                                if(fTermino && new Date() < new Date(fTermino.getTime() + (7 * 24 * 60 * 60 * 1000))) return false; 
                                return true;
                            });

                            let cursoFaltaForo = filasAImprimir.some(item => item.statusForo.includes('❌ No'));
                            let sinAcceso7Dias = /nunca|mes|año/.test(pAcceso.toLowerCase()) || (/(día|dia)/.test(pAcceso.toLowerCase()) && parseInt(pAcceso.match(/\d+/)?.[0] || 0) >= 7);

                            let arrayBotones = [];
                            let listaPendientesMaestra = [];
                            if(sinAcceso7Dias) listaPendientesMaestra.push("- Regularizar su acceso a la plataforma.");
                            if(cursoFaltaForo) listaPendientesMaestra.push("- Participación o moderación en los foros.");
                            if(cursoFaltanNotas) listaPendientesMaestra.push("- Ingreso de calificaciones pendientes.");

                            if(listaPendientesMaestra.length > 0 && pCorreo.includes('@')) {
                                let subjTodo = encodeURIComponent(`Recordatorio de Pendientes Urgentes - ${nombreCurso}`);
                                let bodyTodo = encodeURIComponent(`Estimado/a ${pNombre},\n\nLe escribo para recordarle las siguientes actividades de seguimiento pendientes en la asignatura ${nombreCurso}:\n\n${listaPendientesMaestra.join('\n')}\n\nSaludos cordiales.`);
                                arrayBotones.push(`<a href="mailto:${pCorreo}?subject=${subjTodo}&body=${bodyTodo}" style="display:inline-block;width:100px;padding:6px;background:#34495e;color:white;text-decoration:none;border-radius:4px;font-size:11px;font-weight:bold;text-align:center;border:1px solid #2c3e50;">✉️ Todo Pendiente</a>`);
                            }
                            
                            cursoObj.celdaAcciones = arrayBotones.join('<div style="height:6px;"></div>');
                            datosExtraidos.push(cursoObj);
                        }
                    }
                }
            }catch(e){console.error("Error en aula ID "+ids[i],e);}
        }
        
        if(datosExtraidos.length === 0){
            document.body.innerHTML=`<div style='padding:40px;text-align:center;'><h2>⚠️ Sin resultados</h2><button onclick='location.reload()'>Volver</button></div>`;
            return;
        }

        let cabeceraSuperior = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h2 style='color:${esBusquedaEstudiante?'#2980b9':'#27ae60'};'>${esBusquedaEstudiante?'👤 Historial Student':'✅ Auditoría Consolidada'}</h2><div><button id="btnExportar" style="padding:10px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin-right:10px;">📥 Exportar Excel</button><button onclick='location.reload()' style='padding:10px; background:#7f8c8d; color:white; border:none; border-radius:6px;'>⬅️ Volver</button></div></div>`;
        let titulosColumnas = esBusquedaEstudiante ? ['Asignatura', 'Docente', 'Fechas', 'Evaluación', 'Nota'] : ['Asignatura', 'Docente', 'Correo', 'Último Acceso', 'Acciones', 'Fechas', 'Evaluación', '¿Docente Participó?', 'Faltan', 'Alumnos', 'Rendimiento'];

        document.body.innerHTML=`<div style='padding:20px; font-family:sans-serif;'>${cabeceraSuperior}<div style='overflow-x:auto; max-height:85vh;'><table id='tablaAuditoria' style='border-collapse:collapse;width:100%;font-size:12px;'><thead style='background:${esBusquedaEstudiante?'#2980b9':'#27ae60'};color:white;position:sticky;top:0;'><tr>${titulosColumnas.map(t => `<th style='padding:10px;border:1px solid #bdc3c7;'>${t}</th>`).join('')}</tr><tr class="fila-filtros" style="background:#eaeded;">${titulosColumnas.map((_, i) => i===4&&!esBusquedaEstudiante?`<th></th>`:`<th style='padding:4px;border:1px solid #bdc3c7;'><input class="filtro-col" type="text" placeholder="Filtrar..." style="width:100%;box-sizing:border-box;font-size:11px;padding:5px;"></th>`).join('')}</tr></thead><tbody></tbody></table></div></div>`;

        function renderTabla(){
            let inputs = Array.from(document.querySelectorAll('.filtro-col')).map(el => el.value.toLowerCase().trim());
            let html = ""; let contador = 0;
            
            for(let curso of datosExtraidos){
                let itemsFiltrados = curso.items.filter(item => {
                    if(esBusquedaEstudiante) {
                        return !(inputs[0] && !curso.nombreCurso.toLowerCase().includes(inputs[0])) && !(inputs[1] && !curso.pNombre.toLowerCase().includes(inputs[1])) && !(inputs[4] && !item.notaTexto.toLowerCase().includes(inputs[4]));
                    } else {
                        return !(inputs[0] && !curso.nombreCurso.toLowerCase().includes(inputs[0])) && !(inputs[1] && !curso.pNombre.toLowerCase().includes(inputs[1])) && !(inputs[2] && !curso.pCorreo.toLowerCase().includes(inputs[2]));
                    }
                });

                if(itemsFiltrados.length > 0) {
                    let bg = coloresPastel[contador % coloresPastel.length]; contador++;
                    let rs = itemsFiltrados.length;
                    for(let k = 0; k < itemsFiltrados.length; k++){
                        let it = itemsFiltrados[k];
                        let estiloSeparador = k === 0 ? 'border-top: 3.5px solid #95a5a6;' : '';
                        html += `<tr style='background-color:${bg};'>`;
                        if(k === 0) {
                            if(esBusquedaEstudiante) html += `<td rowspan="${rs}" style='padding:12px;border:1px solid #bdc3c7;${estiloSeparador}'>${curso.nombreCurso}</td><td rowspan="${rs}" style='padding:12px;border:1px solid #bdc3c7;${estiloSeparador}'>${curso.pNombre}</td>`;
                            else html += `<td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}'>${curso.nombreCurso}</td><td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}'>${curso.pNombre}</td><td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}'>${curso.pCorreo}</td><td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}color:${curso.cAcceso};'>${curso.pAcceso}</td><td rowspan="${rs}" style='padding:8px;border:1px solid #bdc3c7;${estiloSeparador}'>${curso.celdaAcciones}</td>`;
                        }
                        if(esBusquedaEstudiante) html += `<td style='border:1px solid #bdc3c7;${estiloSeparador}'>${it.fechasStr}</td><td style='border:1px solid #bdc3c7;${estiloSeparador}'>${it.colNom}</td><td style='border:1px solid #bdc3c7;${estiloSeparador}text-align:center;'>${it.notaTexto}</td></tr>`;
                        else html += `<td style='border:1px solid #bdc3c7;${estiloSeparador}'>${it.fechasStr}</td><td style='border:1px solid #bdc3c7;${estiloSeparador}'>${it.colNom}</td><td style='border:1px solid #bdc3c7;${estiloSeparador}'>${it.statusForo}</td><td style='border:1px solid #bdc3c7;${estiloSeparador}color:${it.faltan>0?"#c0392b":"#27ae60"};'>${it.faltan}</td><td style='border:1px solid #bdc3c7;${estiloSeparador}'>${it.totalAlumnos}</td><td style='border:1px solid #bdc3c7;${estiloSeparador}background:${obtenerColorRendimiento(it.rendimiento, it.textoTermino)};'>${it.rendimiento}%</td></tr>`;
                    }
                }
            }
            document.querySelector('#tablaAuditoria tbody').innerHTML = html || "<tr><td>Sin resultados</td></tr>";
        }

        renderTabla();
        document.querySelectorAll('.filtro-col').forEach(input => input.addEventListener('input', renderTabla));

        document.getElementById('btnExportar').addEventListener('click', () => {
            let clon = document.getElementById('tablaAuditoria').cloneNode(true);
            clon.querySelector('.fila-filtros')?.remove();
            let blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"></head><body>' + clon.outerHTML + '</body></html>'], { type: "application/vnd.ms-excel;charset=utf-8" });
            let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Auditoria.xls'; a.click();
        });
    }

    async function verificarEstadoForo(col,idCurso,pNombre,pId, dCursoPreload){
        let urlForoObjetivo=col.urlDirecta&&(col.urlDirecta.includes("forum/view")||col.urlDirecta.includes("forum/discuss"))?col.urlDirecta:null;
        if(!urlForoObjetivo){
            try{
                let numsCol = normalizarTexto(col.nom).match(/\d+/g) || [];
                let forosCandidatos = [];
                dCursoPreload.querySelectorAll('a[href*="/mod/forum/view.php"]').forEach(enlace => {
                    let t = normalizarTexto(enlace.textContent);
                    if (!/duda|aviso|presenta|diagnostica/i.test(t)) forosCandidatos.push({href: enlace.href, esSala: t.includes("sala")});
                });
                let mejor = forosCandidatos.find(f => f.esSala) || forosCandidatos[0];
                if(mejor) urlForoObjetivo = mejor.href;
            }catch(e){}
        }
        if(!urlForoObjetivo) return "⚠️ Sin Link";
        try{
            let rForo=await fetch(urlForoObjetivo); let raw = await rForo.text();
            if(pId && (raw.includes(`id=${pId}&`) || raw.includes(`userid":${pId}`))) return `✅ Sí <a href="${urlForoObjetivo}" target="_blank">🔗</a>`;
            return `❌ No <a href="${urlForoObjetivo}" target="_blank">🔗</a>`;
        }catch(e){return "⚠️ Error";}
    }

    function configurarColorAcceso(pAcceso){
        let accMin=pAcceso.toLowerCase();
        if(/nunca|mes|año/.test(accMin)) return "#c0392b";
        if(/(día|dia)/.test(accMin) && parseInt(accMin.match(/\d+/)?.[0]||0)>=3) return "#d35400";
        return "#27ae60";
    }

    iniciarPanelUI();
})();
