
class Manejadores {

    // --- LOGICA DE LOGIN ---
    static async handleLogin(e) {
        if (e) e.preventDefault();
        const id = document.getElementById('login-id').value;
        const pwd = document.getElementById('login-pwd').value;
        try {
            const authRes = await ApiService.login(id, pwd);
            console.log("Respuesta del servidor:", authRes);
            const elToken = authRes.Token || authRes.token;
            const elId = authRes.Id_Cliente || authRes.id_Cliente;
            if (!elToken || !elId) {
                throw new Error("Los datos de autenticación están vacíos o no coinciden los nombres.");
            }
            AppStore.getInstance().setSesion(elToken, { id_Cliente: elId });
            const perfil = await ApiService.getPerfil(elId);
            AppStore.getInstance().setSesion(elToken, perfil);
            UIController.switchView('menu-view');
            UIController.renderMenu();
        } catch (error) {
            console.error("Fallo detallado en Login:", error);
            alert("Error al iniciar sesión: " + error.message);
        }
    }

    static async handleSaveCiclo() {
        const store = AppStore.getInstance();
        const stat = document.getElementById('save-status');

        store.cicloEditando.siguiendo = document.getElementById('chk-ciclo-activo').checked;
        if (store.cicloEditando.siguiendo && !store.cicloEditando.fechaActivacion) {
            store.cicloEditando.fechaActivacion = new Date().toISOString();
        }

        // Asegurar PKs y posiciones correctas antes de enviar
        store.cicloEditando.Id_Ciclo = store.cicloEditando.Id_Ciclo || store.cicloEditando.id_Ciclo || 0;
        store.cicloEditando.listaSemanas.forEach((s, sI) => {
            s.Id_Semana = s.Id_Semana || s.id_Semana || 0;
            s.fk_ciclo = store.cicloEditando.Id_Ciclo;
            s.posicion = sI; // Garantizar posición de semana
            s.listaDias.forEach((d, dI) => {
                d.Id_Dia = d.Id_Dia || d.id_Dia || 0;
                d.fk_semana = s.Id_Semana;
                d.listaEjercicios.forEach((ej, eI) => {
                    ej.Id_Ejercicio = ej.Id_Ejercicio || ej.id_Ejercicio || 0;
                    ej.fk_dia = d.Id_Dia;
                    // Garantizar posición: si no tiene, usar índice actual
                    if (ej.posicion === undefined || ej.posicion === null) {
                        ej.posicion = eI;
                    }
                });
            });
        });

        try {
            stat.style.color = "blue"; stat.textContent = "Guardando...";
            await ApiService.saveCiclo(store.cliente.id_Cliente, store.cicloEditando);

            const perfil = await ApiService.getPerfil(store.cliente.id_Cliente);
            store.setSesion(store.token, perfil);

            stat.style.color = "green"; stat.textContent = "Guardado con éxito.";
            setTimeout(() => stat.textContent = "", 3000);
            UIController.renderEdit();
        } catch (error) {
            stat.style.color = "red"; stat.textContent = "Error: " + error.message;
        }
    }

    static handleCrearNuevoCiclo() {
        const nameInput = document.getElementById('input-nuevo-ciclo');
        const nombre = nameInput.value.trim();

        if (!nombre) {
            alert("Por favor, introduce un nombre para el ciclo.");
            return;
        }

        const store = AppStore.getInstance();

        const nuevoCiclo = {
            Id_Ciclo: 0,
            nombre: nombre,
            siguiendo: false,
            fechaActivacion: null,
            listaSemanas: []
        };

        if (!store.cliente.ciclosDB) store.cliente.ciclosDB = [];
        store.cicloEditando = nuevoCiclo;

        document.getElementById('chk-ciclo-activo').checked = false;
        nameInput.value = '';

        UIController.renderSemanas();

        const select = document.getElementById('select-ciclo');
        select.innerHTML = `<option value="0">[Nuevo] ${nombre}</option>` + select.innerHTML;
        select.value = "0";

        alert(`Estructura lista para "${nombre}". Añade semanas y pulsa "Guardar Ciclo en Nube".`);
    }

    static handleAddSemana() {
        const store = AppStore.getInstance();
        const newSemana = {
            nombreSemana: '',
            posicion: store.cicloEditando.listaSemanas.length,
            listaDias: []
        };

        const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        diasNombres.forEach(n => newSemana.listaDias.push({
            nombre_dia: n, kcal: 0, activo: true, listaEjercicios: []
        }));

        store.cicloEditando.listaSemanas.push(newSemana);
        UIController.renderSemanas();
    }

    static async handleDeleteSemana(sIdx) {
        if (!confirm('¿Estás seguro de que quieres borrar esta semana? Esta acción es irreversible.')) return;

        const store = AppStore.getInstance();
        const semana = store.cicloEditando.listaSemanas[sIdx];
        const idSemana = semana.Id_Semana || semana.id_Semana || 0;

        if (idSemana > 0) {
            try {
                await ApiService.deleteSemana(idSemana);
                const perfil = await ApiService.getPerfil(store.cliente.id_Cliente);
                store.setSesion(store.token, perfil);
            } catch (error) {
                alert("No se pudo borrar la semana en el servidor: " + error.message);
                return;
            }
        }

        store.cicloEditando.listaSemanas.splice(sIdx, 1);
        store.cicloEditando.listaSemanas.forEach((sem, index) => {
            sem.posicion = index;
        });

        UIController.renderSemanas();
    }

    // --- BORRAR EJERCICIO ---
    static handleDeleteEjercicio(sIdx, dIdx, eIdx) {
        const store = AppStore.getInstance();
        const lista = store.cicloEditando.listaSemanas[sIdx].listaDias[dIdx].listaEjercicios;
        lista.splice(eIdx, 1);
        // Recalcular posiciones
        lista.forEach((ej, i) => ej.posicion = i);
        UIController.renderSemanas();
    }
// --- REORDENAR SEMANAS ---
    static handleReorderSemana(fromIdx, toIdx) {
        const store = AppStore.getInstance();
        const lista = store.cicloEditando.listaSemanas;
        
        // Bloqueo si intenta subir la primera o bajar la última
        if (toIdx < 0 || toIdx >= lista.length) return;
        
        // Extrae la semana y la inserta en su nueva posición
        const [moved] = lista.splice(fromIdx, 1);
        lista.splice(toIdx, 0, moved);
        
        // Fuerza el recálculo de la propiedad 'posicion' para la base de datos
        lista.forEach((sem, i) => sem.posicion = i);
        
        UIController.renderSemanas();
    }

    // --- CLONAR SEMANA ---
    static handleCloneSemana(sIdx) {
        const store = AppStore.getInstance();
        const semanaPadre = store.cicloEditando.listaSemanas[sIdx];
        
        // Truco Ninja: Copia profunda desconectada
        const clone = JSON.parse(JSON.stringify(semanaPadre));
        
        // Limpieza profunda de IDs (Nacen huérfanos para que la BD los cree nuevos)
        clone.id_Semana = 0;
        clone.nombre_semana = clone.nombre_semana + " (Clon)";
        clone.listaDias.forEach(d => {
            d.id_Dia = 0; d.fk_semana = 0;
            d.listaEjercicios.forEach(e => { e.id_Ejercicio = 0; e.fk_dia = 0; });
        });
        
        // Lo añadimos justo debajo de su padre
        store.cicloEditando.listaSemanas.splice(sIdx + 1, 0, clone);
        store.cicloEditando.listaSemanas.forEach((s, i) => s.posicion = i);
        
        UIController.renderSemanas();
    }

    // --- CLONAR CICLO ENTERO ---
    static handleCloneCiclo() {
        const store = AppStore.getInstance();
        if (!store.cicloEditando) return;

        const clone = JSON.parse(JSON.stringify(store.cicloEditando));
        
        clone.Id_Ciclo = 0;
        clone.nombre = clone.nombre + " (Clon)";
        clone.siguiendo = false;
        clone.fechaActivacion = null;
        
        clone.listaSemanas.forEach(s => {
            s.id_Semana = 0; s.fk_ciclo = 0;
            s.listaDias.forEach(d => {
                d.id_Dia = 0; d.fk_semana = 0;
                d.listaEjercicios.forEach(e => { e.id_Ejercicio = 0; e.fk_dia = 0; });
            });
        });

        store.cicloEditando = clone;
        
        // Engañamos a la UI para que seleccione "Crear Nuevo" y pinte el clon
        document.getElementById('select-ciclo').value = "0"; 
        document.getElementById('input-nuevo-ciclo').value = clone.nombre;
        
        UIController.renderEdit();
        alert("¡Ciclo clonado en pantalla! Dale a 'Guardar Cambios' para consolidarlo en tu cuenta.");
    }
    // --- LOGICA DE REGISTRAR ---
    static async handleRegister(e) {
        e.preventDefault();
        const id = document.getElementById('reg-id').value;
        const pwd = document.getElementById('reg-pass').value;

        try {
            await ApiService.registrar(id, pwd);
            alert("Usuario creado con éxito. Ya puedes iniciar sesión.");
            UIController.switchView('login-view');
        } catch (error) {
            alert("Error al registrar: " + error.message);
        }
    }
}
