
// ==========================================
// 3. UI CONTROLLER
// ==========================================
class UIController {

    static views = ['login-view', 'register-view', 'menu-view', 'edit-view'];

    static init() {
        const store = AppStore.getInstance();
        this.bindEvents();
        if (store.token && store.cliente) {
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
    // --- LOGICA DE MENÚ ---
    static renderMenu() {
        const store = AppStore.getInstance();
        document.getElementById('menu-title').textContent = `Hola, ${store.cliente.id_Cliente}`;
        this.switchView('menu-view');
        const listaCiclos = store.cliente.ciclosDB || store.cliente.CiclosDB || [];
        const cicloActivo = listaCiclos.find(c => c.siguiendo);
        const contHoy = document.getElementById('hoy-contenido');
        const txtFecha = document.getElementById('hoy-fecha');

        // MODIFICACIÓN AQUÍ: Si el ciclo está marcado pero no tiene fechaActivacion (recién activado)
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

        // Cálculo de días alineado a la semana real (Lunes = 0, Domingo = 6)
        const fechaAct = new Date(cicloActivo.fechaActivacion);
        fechaAct.setHours(0, 0, 0, 0);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Mapeamos el día de la semana para que Lunes sea 0 y Domingo 6
        const dayMap = [6, 0, 1, 2, 3, 4, 5];

        // Obtenemos el Lunes de la semana en la que se activó el ciclo
        const actDayOfWeek = dayMap[fechaAct.getDay()];
        const fechaLunesAct = new Date(fechaAct);
        fechaLunesAct.setDate(fechaAct.getDate() - actDayOfWeek);

        // Diferencia de días desde ese Lunes hasta hoy
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

        txtFecha.textContent = `${diaToca.nombre_dia} de la ${semanaToca.nombre || 'Semana ' + (semanaIndex + 1)}`;

        if (!diaToca.activo) {
            contHoy.innerHTML = `
                <div class="info-box success">
                    <p>¡Descanso merecido! <em>${diaToca.nombre_dia}</em> está marcado como inactivo.</p>
                </div>`;
            return;
        }

        let tablaHTML = `<table class="excel-table"><tr><th>Ejercicio</th><th>Series</th><th>Reps</th><th>Descanso</th></tr>`;
        diaToca.listaEjercicios.forEach(ej => {
            tablaHTML += `<tr><td>${ej.nombre}</td><td>${ej.series}</td><td>${ej.repeticiones}</td><td>${ej.descanso}</td></tr>`;
        });
        tablaHTML += `</table>`;
        contHoy.innerHTML = tablaHTML;
    }
    // --- LOGICA DE EDICIÓN ---
    static renderEdit() {
        const store = AppStore.getInstance();
        this.switchView('edit-view');

        // Captura segura de la lista real del backend
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
            // Si está vacío, creamos un objeto vacío temporal para que no sea null
            store.cicloEditando = { id_Ciclo: 0, nombre: '', siguiendo: false, listaSemanas: [] };
        }
    }

    static renderSemanas() {
        const store = AppStore.getInstance();
        const container = document.getElementById('semanas-container');
        
        // Guardar estado de semanas expandidas
        const expandedWeeks = new Set();
        document.querySelectorAll('.dias-container.expanded').forEach(el => expandedWeeks.add(el.id));

        container.innerHTML = '';

        if (!store.cicloEditando || !store.cicloEditando.listaSemanas) return;

        store.cicloEditando.listaSemanas.forEach((sem, sIdx) => {
            const semDiv = document.createElement('div');
            semDiv.className = 'semana-block';

            semDiv.innerHTML = `
                <div class="semana-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <span onclick="this.parentElement.nextElementSibling.classList.toggle('expanded')" style="cursor:pointer; flex-grow: 1;">
                        Semana ${sIdx + 1}: ${sem.nombreSemana || ''} ▼
                    </span>
                    <button class="btn-danger btn-inline" onclick="event.stopPropagation(); Manejadores.handleDeleteSemana(${sIdx});" style="margin: 0; width: auto; font-size: 0.8rem; padding: 0.4rem 0.8rem;">Borrar</button>
                </div>
                <div class="dias-container" id="sem-${sIdx}"></div>
            `;

            const diasCont = semDiv.querySelector('.dias-container');
            if (expandedWeeks.has(`sem-${sIdx}`)) {
                diasCont.classList.add('expanded');
            }

            sem.listaDias.forEach((dia, dIdx) => {
                let ejRows = dia.listaEjercicios.map((ej, eIdx) => `
                    <tr>
                        <td><input type="text" class="input-ej-nombre" value="${ej.nombre || ''}" onchange="UIController.updateObj(${sIdx},${dIdx},${eIdx},'nombre',this.value)"></td>
                        <td><input type="number" class="input-ej-series" value="${ej.series || ''}" onchange="UIController.updateObj(${sIdx},${dIdx},${eIdx},'series',parseInt(this.value))"></td>
                        <td><input type="text" class="input-ej-reps" value="${ej.repeticiones || ''}" onchange="UIController.updateObj(${sIdx},${dIdx},${eIdx},'repeticiones',this.value)"></td>
                        <td><input type="text" class="input-ej-desc" value="${ej.descanso || ''}" onchange="UIController.updateObj(${sIdx},${dIdx},${eIdx},'descanso',this.value)"></td>
                    </tr>
                `).join('');

                diasCont.innerHTML += `
                    <div class="dia-card">
                        <div class="flex-row">
                            <strong>${dia.nombre_dia}</strong>
                            <label>
                                <input type="checkbox" ${dia.activo ? 'checked' : ''} onchange="UIController.updateDia(${sIdx},${dIdx},'activo',this.checked)"> Activo
                            </label>
                            <input type="number" class="input-kcal" placeholder="Kcal" value="${dia.kcal || ''}" onchange="UIController.updateDia(${sIdx},${dIdx},'kcal',parseFloat(this.value))">
                        </div>
                        <table class="excel-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Series</th>
                                    <th>Reps</th>
                                    <th>Descanso</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-${sIdx}-${dIdx}">${ejRows}</tbody>
                        </table>
                        <button class="btn-secondary btn-inline" onclick="UIController.addEjercicio(${sIdx}, ${dIdx})">+ Añadir Ejercicio</button>
                    </div>`;
            });
            container.appendChild(semDiv);
        });
    }

    static loadCicloToEdit() {
        const store = AppStore.getInstance();
        const idSelec = document.getElementById('select-ciclo').value;
        const listaCiclos = store.cliente.CiclosDB || store.cliente.ciclosDB || [];

        const cicloEncontrado = listaCiclos.find(c => c.Id_Ciclo == idSelec || c.id_Ciclo == idSelec);

        if (cicloEncontrado) {
            store.cicloEditando = JSON.parse(JSON.stringify(cicloEncontrado));
        } else {
            // SI ES EL CICLO NUEVO ("0"), lo respetamos. Si no, metemos uno vacío para evitar el NULL CRASH
            if (idSelec !== "0") {
                store.cicloEditando = { Id_Ciclo: 0, nombre: '', siguiendo: false, fechaActivacion: null, listaSemanas: [] };
            }
        }
        // Añadimos un fallback (|| false) por si acaso
        document.getElementById('chk-ciclo-activo').checked = store.cicloEditando.siguiendo || false;
        this.renderSemanas();
    }

    static updateObj(sIdx, dIdx, eIdx, prop, val) {
        // C# espera números enteros, los forzamos
        if (prop === 'series' || prop === 'repeticiones') val = parseInt(val) || 0;

        AppStore.getInstance().cicloEditando.listaSemanas[sIdx].listaDias[dIdx].listaEjercicios[eIdx][prop] = val;
    }

    static updateDia(sIdx, dIdx, prop, val) {
        // C# espera un float para las kcal
        if (prop === 'kcal') val = parseFloat(val) || 0;

        AppStore.getInstance().cicloEditando.listaSemanas[sIdx].listaDias[dIdx][prop] = val;
    }

    static addEjercicio(sIdx, dIdx) {
        AppStore.getInstance().cicloEditando.listaSemanas[sIdx].listaDias[dIdx].listaEjercicios.push({
            nombre: '', series: 0, repeticiones: 0, descanso: '', descripcion: '', posicion: 0
        });
        this.renderSemanas(); // Re-render para mostrar la nueva fila
    }



}
