// ==========================================
// 3. UI CONTROLLER
// ==========================================
class UIController {

    static views = ['login-view', 'register-view', 'menu-view', 'edit-view'];
    static _semanaVistaActiva = false; // Controla si la VistaCompletaSemana está visible

    static init() {
        const store = AppStore.getInstance();
        this.bindEvents();
        if (store.token && store.cliente) {
            this.switchView('menu-view');
            this.renderMenu();
        }
    }

    static switchView(viewId) {
        this.views.forEach(v => document.getElementById(v).classList.remove('active-view'));
        document.getElementById(viewId).classList.add('active-view');
    }

    static bindEvents() {
        const bind = (id, event, handler) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, handler);
        };

        bind('login-form', 'submit', Manejadores.handleLogin);
        bind('btn-logout', 'click', () => { AppStore.getInstance().cerrarSesion(); this.switchView('login-view'); });
        bind('btn-go-edit', 'click', this.renderEdit.bind(this));
        bind('btn-go-menu', 'click', this.renderMenu.bind(this));
        bind('select-ciclo', 'change', this.loadCicloToEdit.bind(this));
        bind('btn-guardar-ciclo', 'click', Manejadores.handleSaveCiclo);
        bind('btn-add-semana', 'click', Manejadores.handleAddSemana);
        bind('btn-to-register', 'click', () => this.switchView('register-view'));
        bind('btn-to-login', 'click', () => this.switchView('login-view'));
        bind('register-form', 'submit', Manejadores.handleRegister);
        bind('btn-crear-ciclo', 'click', Manejadores.handleCrearNuevoCiclo);

        bind('chk-ciclo-activo', 'change', (e) => {
            const store = AppStore.getInstance();
            if (store.cicloEditando) {
                store.cicloEditando.siguiendo = e.target.checked;
            }
        });
    }

    // ==========================================
    // MENÚ / VISTA DE HOY
    // ==========================================
    static renderMenu() {
        const store = AppStore.getInstance();
        document.getElementById('menu-title').textContent = `Hola, ${store.cliente.id_Cliente}`;
        this.switchView('menu-view');
        this._semanaVistaActiva = false;

        const listaCiclos = store.cliente.ciclosDB || store.cliente.CiclosDB || [];
        const cicloActivo = listaCiclos.find(c => c.siguiendo);
        const contHoy = document.getElementById('hoy-contenido');
        const txtFecha = document.getElementById('hoy-fecha');

        if (cicloActivo && !cicloActivo.fechaActivacion) {
            cicloActivo.fechaActivacion = new Date().toISOString();
        }

        if (!cicloActivo || !cicloActivo.fechaActivacion) {
            txtFecha.textContent = "Sin ciclo activo";
            contHoy.innerHTML = `
                <div class="info-box danger">
                    <p class="bold-text">No estás siguiendo ningún ciclo actualmente.</p>
                    <p class="sub-text">Ve a "Editar Rutinas" y marca la casilla para activar un ciclo.</p>
                </div>`;
            return;
        }

        const fechaAct = new Date(cicloActivo.fechaActivacion);
        fechaAct.setHours(0, 0, 0, 0);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const dayMap = [6, 0, 1, 2, 3, 4, 5];
        const actDayOfWeek = dayMap[fechaAct.getDay()];
        const fechaLunesAct = new Date(fechaAct);
        fechaLunesAct.setDate(fechaAct.getDate() - actDayOfWeek);

        const diffTime = hoy.getTime() - fechaLunesAct.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const semanaIndex = Math.floor(diffDays / 7);
        const diaIndex = dayMap[hoy.getDay()];

        if (semanaIndex >= cicloActivo.listaSemanas.length) {
            txtFecha.textContent = "Ciclo Terminado";
            contHoy.innerHTML = `
                <div class="info-box success">
                    <p>Has completado todas las semanas de este ciclo.</p>
                </div>`;
            return;
        }

        const semanaToca = cicloActivo.listaSemanas[semanaIndex];
        const diaToca = semanaToca.listaDias[diaIndex];

        txtFecha.textContent = `${diaToca.nombre_dia} · ${semanaToca.nombreSemana || 'Semana ' + (semanaIndex + 1)}`;

        if (!diaToca.activo) {
            contHoy.innerHTML = `
                <div class="info-box success">
                    <p>¡Descanso merecido! <em>${diaToca.nombre_dia}</em> está marcado como inactivo.</p>
                </div>`;
            return;
        }

        // Ejercicios con nombre solamente
        const ejerciciosValidos = (diaToca.listaEjercicios || [])
            .filter(ej => ej.nombre && ej.nombre.trim() !== '')
            .sort((a, b) => (a.posicion || 0) - (b.posicion || 0));

        // Tabla del día + botón para ver semana completa
        let tablaHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <p style="color:var(--md-text-muted); font-size:0.9rem;">${ejerciciosValidos.length} ejercicio(s) para hoy</p>
                <button id="btn-toggle-semana" onclick="UIController.toggleVistaCompletaSemana(${semanaIndex}, ${diaIndex})" 
                    class="btn-secondary btn-inline" style="font-size:0.85rem; padding:0.5rem 1.2rem;">
                    📅 Ver semana completa
                </button>
            </div>
            <div id="vista-dia-hoy">`;

        if (ejerciciosValidos.length === 0) {
            tablaHTML += `<div class="info-box"><p>No hay ejercicios definidos para hoy.</p></div>`;
        } else {
            tablaHTML += `<table class="excel-table"><thead><tr><th>#</th><th>Ejercicio</th><th>Series</th><th>Reps</th><th>Descanso</th></tr></thead><tbody>`;
            ejerciciosValidos.forEach((ej, i) => {
                tablaHTML += `<tr><td style="color:var(--md-text-muted); font-size:0.8rem;">${i + 1}</td><td>${ej.nombre}</td><td>${ej.series}</td><td>${ej.repeticiones}</td><td>${ej.descanso || '—'}</td></tr>`;
            });
            tablaHTML += `</tbody></table>`;
        }

        tablaHTML += `</div><div id="vista-semana-completa" style="display:none;"></div>`;
        contHoy.innerHTML = tablaHTML;

        // Guardar referencia al ciclo activo y semana para la vista
        this._cicloActivoMenu = cicloActivo;
        this._semanaIndexMenu = semanaIndex;
        this._diaIndexMenu = diaIndex;
    }

    // ==========================================
    // VISTA COMPLETA DE SEMANA (MENÚ)
    // ==========================================
    static toggleVistaCompletaSemana(semanaIndex, diaIndex) {
        const vistaDia = document.getElementById('vista-dia-hoy');
        const vistaSemana = document.getElementById('vista-semana-completa');
        const btn = document.getElementById('btn-toggle-semana');

        this._semanaVistaActiva = !this._semanaVistaActiva;

        if (this._semanaVistaActiva) {
            vistaDia.style.display = 'none';
            btn.textContent = '← Volver al día de hoy';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary-active');
            this._renderVistaCompletaSemana(semanaIndex, diaIndex);
            vistaSemana.style.display = 'block';
        } else {
            vistaDia.style.display = 'block';
            vistaSemana.style.display = 'none';
            btn.textContent = '📅 Ver semana completa';
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-primary-active');
        }
    }

    static _renderVistaCompletaSemana(semanaIndex, diaIndex) {
        const ciclo = this._cicloActivoMenu;
        if (!ciclo) return;

        const semana = ciclo.listaSemanas[semanaIndex];
        const nombreSemana = semana.nombreSemana || `Semana ${semanaIndex + 1}`;
        const vistaSemana = document.getElementById('vista-semana-completa');

        // Calcular el máximo de ejercicios en cualquier día para las filas
        const maxEjercicios = Math.max(...semana.listaDias.map(d =>
            (d.listaEjercicios || []).filter(ej => ej.nombre && ej.nombre.trim() !== '').length
        ), 0);

        // Construir tabla: días como columnas, ejercicios como filas
        let html = `
            <div class="vista-semana-wrapper">
                <div class="vista-semana-header">
                    <h3 style="margin:0; color:var(--md-primary);">📅 ${nombreSemana} — Vista completa</h3>
                    <p style="margin:0.25rem 0 0; color:var(--md-text-muted); font-size:0.85rem;">El día actual está resaltado</p>
                </div>
                <div class="tabla-semana-scroll">
                <table class="tabla-semana-completa">
                    <thead>
                        <tr>
                            <th class="th-fila-num">#</th>`;

        semana.listaDias.forEach((dia, dIdx) => {
            const esHoy = dIdx === diaIndex;
            const claseHoy = esHoy ? 'dia-hoy' : '';
            const iconoDescanso = !dia.activo ? ' 😴' : '';
            html += `<th class="th-dia ${claseHoy}">
                        ${esHoy ? '<span class="badge-hoy">HOY</span>' : ''}
                        ${dia.nombre_dia}${iconoDescanso}
                        ${dia.kcal ? `<span class="kcal-badge">${dia.kcal} kcal</span>` : ''}
                     </th>`;
        });

        html += `</tr></thead><tbody>`;

        if (maxEjercicios === 0) {
            html += `<tr><td colspan="${semana.listaDias.length + 1}" style="text-align:center; color:var(--md-text-muted); padding:2rem;">
                No hay ejercicios definidos esta semana.
            </td></tr>`;
        } else {
            // Preparar ejercicios ordenados por día
            const ejerciciosPorDia = semana.listaDias.map(d =>
                (d.listaEjercicios || [])
                    .filter(ej => ej.nombre && ej.nombre.trim() !== '')
                    .sort((a, b) => (a.posicion || 0) - (b.posicion || 0))
            );

            for (let fila = 0; fila < maxEjercicios; fila++) {
                html += `<tr>`;
                html += `<td class="td-num">${fila + 1}</td>`;
                semana.listaDias.forEach((dia, dIdx) => {
                    const esHoy = dIdx === diaIndex;
                    const claseHoy = esHoy ? 'celda-hoy' : '';
                    const ej = ejerciciosPorDia[dIdx][fila];
                    if (!dia.activo) {
                        if (fila === 0) {
                            html += `<td class="celda-descanso ${claseHoy}" rowspan="${maxEjercicios}">Descanso</td>`;
                        }
                    } else if (ej) {
                        html += `<td class="${claseHoy}">
                            <div class="ej-nombre">${ej.nombre}</div>
                            <div class="ej-detalle">${ej.series}×${ej.repeticiones}${ej.descanso ? ' · ' + ej.descanso : ''}</div>
                        </td>`;
                    } else {
                        html += `<td class="${claseHoy} celda-vacia">—</td>`;
                    }
                });
                html += `</tr>`;
            }
        }

        html += `</tbody></table></div></div>`;
        vistaSemana.innerHTML = html;
    }

    // ==========================================
    // EDICIÓN DE CICLOS
    // ==========================================
    static renderEdit() {
        const store = AppStore.getInstance();
        this.switchView('edit-view');

        const listaCiclos = store.cliente.ciclosDB || store.cliente.CiclosDB || [];
        const select = document.getElementById('select-ciclo');
        const currentSelection = select.value;
        select.innerHTML = listaCiclos.map(c => `<option value="${c.Id_Ciclo || c.id_Ciclo}">${c.nombre}</option>`).join('');

        if (listaCiclos.length > 0) {
            if (currentSelection === "0" && store.cicloEditando) {
                const newlySaved = listaCiclos.find(c => c.nombre === store.cicloEditando.nombre);
                if (newlySaved) select.value = newlySaved.Id_Ciclo || newlySaved.id_Ciclo;
            } else if (currentSelection && listaCiclos.some(c => (c.Id_Ciclo || c.id_Ciclo) == currentSelection)) {
                select.value = currentSelection;
            } else {
                const cicloActivo = listaCiclos.find(c => c.siguiendo) || listaCiclos[0];
                select.value = cicloActivo.Id_Ciclo || cicloActivo.id_Ciclo;
            }
            this.loadCicloToEdit();
        } else {
            select.innerHTML = '<option value="">No hay ciclos disponibles</option>';
            document.getElementById('semanas-container').innerHTML = '';
            store.cicloEditando = { id_Ciclo: 0, nombre: '', siguiendo: false, listaSemanas: [] };
        }
    }

    // ==========================================
    // RENDER SEMANAS con drag & drop y renombrado
    // ==========================================
    static renderSemanas() {
        const store = AppStore.getInstance();
        const container = document.getElementById('semanas-container');

        const expandedWeeks = new Set();
        document.querySelectorAll('.dias-container.expanded').forEach(el => expandedWeeks.add(el.id));

        container.innerHTML = '';

        if (!store.cicloEditando || !store.cicloEditando.listaSemanas) return;

        store.cicloEditando.listaSemanas.forEach((sem, sIdx) => {
            const semDiv = document.createElement('div');
            semDiv.className = 'semana-block';
            semDiv.draggable = true;
            semDiv.dataset.sIdx = sIdx;

            // Drag events para semanas
            semDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'semana', sIdx }));
                semDiv.classList.add('dragging-semana');
            });
            semDiv.addEventListener('dragend', () => semDiv.classList.remove('dragging-semana'));
            semDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
                semDiv.classList.add('drag-over-semana');
            });
            semDiv.addEventListener('dragleave', () => semDiv.classList.remove('drag-over-semana'));
            semDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                semDiv.classList.remove('drag-over-semana');
                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (data.type === 'semana' && data.sIdx !== sIdx) {
                        Manejadores.handleReorderSemana(data.sIdx, sIdx);
                    }
                } catch {}
            });

            semDiv.innerHTML = `
                <div class="semana-header">
                    <span class="drag-handle-semana" title="Arrastrar para reordenar">⠿</span>
                    <div style="flex-grow:1; cursor:pointer;" onclick="this.closest('.semana-block').querySelector('.dias-container').classList.toggle('expanded')">
                        <input type="text" class="semana-nombre-input" value="${sem.nombreSemana || ''}" 
                            placeholder="Nombre de semana (ej: Hipertrofia vol.1)"
                            onclick="event.stopPropagation()"
                            onchange="UIController.updateSemanaNombre(${sIdx}, this.value)"
                            title="Haz clic para renombrar la semana">
                        <span class="semana-expand-icon">▼</span>
                    </div>
                    <div class="semana-actions">
                        <button class="btn-danger btn-inline" 
                            onclick="event.stopPropagation(); Manejadores.handleDeleteSemana(${sIdx});" 
                            style="margin:0; width:auto; font-size:0.8rem; padding:0.4rem 0.8rem;">Borrar</button>
                    </div>
                </div>
                <div class="dias-container" id="sem-${sIdx}"></div>
            `;

            const diasCont = semDiv.querySelector('.dias-container');
            if (expandedWeeks.has(`sem-${sIdx}`)) diasCont.classList.add('expanded');

            sem.listaDias.forEach((dia, dIdx) => {
                // Ejercicios ordenados por posición
                const ejerciciosOrdenados = [...(dia.listaEjercicios || [])].sort((a, b) => (a.posicion || 0) - (b.posicion || 0));

                let ejRows = ejerciciosOrdenados.map((ej, eIdx) => {
                    // eIdx aquí es el índice en el array ORDENADO, necesitamos el original
                    const eIdxReal = dia.listaEjercicios.indexOf(ej);
                    return `
                    <tr class="ejercicio-drag-row" draggable="true" 
                        data-s="${sIdx}" data-d="${dIdx}" data-e="${eIdxReal}"
                        ondragstart="UIController.onEjDragStart(event, ${sIdx}, ${dIdx}, ${eIdxReal})"
                        ondragover="UIController.onEjDragOver(event)"
                        ondragleave="UIController.onEjDragLeave(event)"
                        ondrop="UIController.onEjDrop(event, ${sIdx}, ${dIdx}, ${eIdxReal})"
                        ondragend="UIController.onEjDragEnd(event)">
                        <td style="cursor:grab; color:var(--md-text-muted); text-align:center; width:2rem;" title="Arrastrar para reordenar">⠿</td>
                        <td><input type="text" class="input-ej-nombre" value="${ej.nombre || ''}" 
                            onchange="UIController.updateObj(${sIdx},${dIdx},${eIdxReal},'nombre',this.value)"></td>
                        <td><input type="number" class="input-ej-series" value="${ej.series || ''}" 
                            onchange="UIController.updateObj(${sIdx},${dIdx},${eIdxReal},'series',parseInt(this.value))"></td>
                        <td><input type="text" class="input-ej-reps" value="${ej.repeticiones || ''}" 
                            onchange="UIController.updateObj(${sIdx},${dIdx},${eIdxReal},'repeticiones',this.value)"></td>
                        <td><input type="text" class="input-ej-desc" value="${ej.descanso || ''}" 
                            onchange="UIController.updateObj(${sIdx},${dIdx},${eIdxReal},'descanso',this.value)"></td>
                        <td>
                            <button class="btn-danger btn-inline" title="Eliminar ejercicio"
                                onclick="Manejadores.handleDeleteEjercicio(${sIdx},${dIdx},${eIdxReal})"
                                style="margin:0; padding:0.4rem 0.7rem; border-radius:6px;">✕</button>
                        </td>
                    </tr>`;
                }).join('');

                diasCont.innerHTML += `
                    <div class="dia-card">
                        <div class="flex-row">
                            <strong>${dia.nombre_dia}</strong>
                            <label>
                                <input type="checkbox" ${dia.activo ? 'checked' : ''} 
                                    onchange="UIController.updateDia(${sIdx},${dIdx},'activo',this.checked)"> Activo
                            </label>
                            <input type="number" class="input-kcal" placeholder="Kcal" value="${dia.kcal || ''}" 
                                onchange="UIController.updateDia(${sIdx},${dIdx},'kcal',parseFloat(this.value))">
                        </div>
                        <table class="excel-table">
                            <thead>
                                <tr>
                                    <th style="width:2rem;"></th>
                                    <th>Nombre</th>
                                    <th>Series</th>
                                    <th>Reps</th>
                                    <th>Descanso</th>
                                    <th style="width:3rem;"></th>
                                </tr>
                            </thead>
                            <tbody id="tbody-${sIdx}-${dIdx}">${ejRows}</tbody>
                        </table>
                        <button class="btn-secondary btn-inline" 
                            onclick="UIController.addEjercicio(${sIdx}, ${dIdx})"
                            style="margin-top:0.75rem;">+ Añadir Ejercicio</button>
                    </div>`;
            });

            container.appendChild(semDiv);
        });
    }

    // ==========================================
    // DRAG & DROP EJERCICIOS
    // ==========================================
    static onEjDragStart(e, sIdx, dIdx, eIdx) {
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'ejercicio', sIdx, dIdx, eIdx }));
        e.currentTarget.classList.add('dragging-ej');
        e.stopPropagation(); // Evitar que se active el drag de semana
    }

    static onEjDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over-ej');
    }

    static onEjDragLeave(e) {
        e.currentTarget.classList.remove('drag-over-ej');
    }

    static onEjDragEnd(e) {
        e.currentTarget.classList.remove('dragging-ej');
        document.querySelectorAll('.drag-over-ej').forEach(el => el.classList.remove('drag-over-ej'));
    }

    static onEjDrop(e, targetS, targetD, targetE) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over-ej');

        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.type !== 'ejercicio') return;
            if (data.sIdx !== targetS || data.dIdx !== targetD) return; // Solo dentro del mismo día
            if (data.eIdx === targetE) return;

            const store = AppStore.getInstance();
            const lista = store.cicloEditando.listaSemanas[targetS].listaDias[targetD].listaEjercicios;

            // Reordenar en el array
            const [moved] = lista.splice(data.eIdx, 1);
            lista.splice(targetE, 0, moved);

            // Actualizar posiciones
            lista.forEach((ej, i) => ej.posicion = i);

            this.renderSemanas();
        } catch (err) {
            console.error('Drop error:', err);
        }
    }

    // ==========================================
    // ACTUALIZACIONES DE DATOS
    // ==========================================
    static updateSemanaNombre(sIdx, valor) {
        AppStore.getInstance().cicloEditando.listaSemanas[sIdx].nombreSemana = valor;
    }

    static loadCicloToEdit() {
        const store = AppStore.getInstance();
        const idSelec = document.getElementById('select-ciclo').value;
        const listaCiclos = store.cliente.CiclosDB || store.cliente.ciclosDB || [];
        const cicloEncontrado = listaCiclos.find(c => c.Id_Ciclo == idSelec || c.id_Ciclo == idSelec);

        if (cicloEncontrado) {
            store.cicloEditando = JSON.parse(JSON.stringify(cicloEncontrado));
        } else {
            if (idSelec !== "0") {
                store.cicloEditando = { Id_Ciclo: 0, nombre: '', siguiendo: false, fechaActivacion: null, listaSemanas: [] };
            }
        }
        document.getElementById('chk-ciclo-activo').checked = store.cicloEditando.siguiendo || false;
        this.renderSemanas();
    }

    static updateObj(sIdx, dIdx, eIdx, prop, val) {
        if (prop === 'series') val = parseInt(val) || 0;
        AppStore.getInstance().cicloEditando.listaSemanas[sIdx].listaDias[dIdx].listaEjercicios[eIdx][prop] = val;
    }

    static updateDia(sIdx, dIdx, prop, val) {
        if (prop === 'kcal') val = parseFloat(val) || 0;
        AppStore.getInstance().cicloEditando.listaSemanas[sIdx].listaDias[dIdx][prop] = val;
    }

    static addEjercicio(sIdx, dIdx) {
        const lista = AppStore.getInstance().cicloEditando.listaSemanas[sIdx].listaDias[dIdx].listaEjercicios;
        const nuevaPosicion = lista.length; // Posición = índice actual al final
        lista.push({
            nombre: '', series: 0, repeticiones: 0, descanso: '', descripcion: '', posicion: nuevaPosicion
        });
        this.renderSemanas();
    }
}
