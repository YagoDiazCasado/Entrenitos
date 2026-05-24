
class Manejadores {

    // --- LOGICA DE LOGIN ---
    static async handleLogin(e) {
        if (e) e.preventDefault();
        const id = document.getElementById('login-id').value;
        const pwd = document.getElementById('login-pwd').value;
        try {
            // 2. HACER LOGIN
            const authRes = await ApiService.login(id, pwd);
            console.log("Respuesta del servidor:", authRes);
            // 3. CAPTURAR DATOS (Buscamos la mayúscula de C# o la minúscula)
            const elToken = authRes.Token || authRes.token;
            const elId = authRes.Id_Cliente || authRes.id_Cliente;
            if (!elToken || !elId) {
                throw new Error("Los datos de autenticación están vacíos o no coinciden los nombres.");
            }
            // 4. GUARDAR TOKEN EN EL STORE PRIMERO (¡Crítico!)
            AppStore.getInstance().setSesion(elToken, { id_Cliente: elId });
            // 5. PEDIR EL PERFIL (ahora fetchWithAuth ya tendrá el token disponible)
            const perfil = await ApiService.getPerfil(elId);
            // 6. GUARDAR SESIÓN COMPLETA Y CAMBIAR VISTA
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

        // Regla: si se activa este, se desactivan los demás en la UI (el backend lo hace en BD)
        store.cicloEditando.siguiendo = document.getElementById('chk-ciclo-activo').checked;
        if (store.cicloEditando.siguiendo && !store.cicloEditando.fechaActivacion) {
            store.cicloEditando.fechaActivacion = new Date().toISOString();
        }

        // Asegurar que las PKs tengan la mayúscula inicial para que el backend (C#) las pille bien
        store.cicloEditando.Id_Ciclo = store.cicloEditando.Id_Ciclo || store.cicloEditando.id_Ciclo || 0;
        store.cicloEditando.listaSemanas.forEach(s => {
            s.Id_Semana = s.Id_Semana || s.id_Semana || 0;
            s.fk_ciclo = store.cicloEditando.Id_Ciclo;
            s.listaDias.forEach(d => {
                d.Id_Dia = d.Id_Dia || d.id_Dia || 0;
                d.fk_semana = s.Id_Semana;
                d.listaEjercicios.forEach(e => {
                    e.Id_Ejercicio = e.Id_Ejercicio || e.id_Ejercicio || 0;
                    e.fk_dia = d.Id_Dia;
                });
            });
        });

        try {
            stat.style.color = "blue"; stat.textContent = "Guardando...";
            await ApiService.saveCiclo(store.cliente.id_Cliente, store.cicloEditando);

            // Recargar perfil completo para mantener consistencia
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

        // Inicializamos un objeto limpio con Id_Ciclo = 0 para que C# sepa que es un INSERT
        const nuevoCiclo = {
            Id_Ciclo: 0,
            nombre: nombre,
            siguiendo: false,
            fechaActivacion: null,
            listaSemanas: []
        };

        // Aseguramos que el cliente tenga inicializado su array de ciclos
        if (!store.cliente.ciclosDB) store.cliente.ciclosDB = [];

        // Lo asignamos como el ciclo que estamos editando actualmente
        store.cicloEditando = nuevoCiclo;

        // Forzamos el render para que aparezca vacío y el usuario pueda empezar a pulsar "+ Añadir Semana"
        document.getElementById('chk-ciclo-activo').checked = false;
        nameInput.value = ''; // Limpiamos el input

        UIController.renderSemanas();

        // Opcional: añadimos un indicador visual en el select
        const select = document.getElementById('select-ciclo');
        select.innerHTML = `<option value="0">[Nuevo] ${nombre}</option>` + select.innerHTML;
        select.value = "0";

        alert(`Estructura lista para "${nombre}". Añade semanas y pulsa "Guardar Cambios".`);
    }


    static handleAddSemana() {
        const store = AppStore.getInstance();

        // CORREGIDO: Usamos nombreSemanas
        const newSemana = { nombreSemana: '', posicion: store.cicloEditando.listaSemanas.length, listaDias: [] };

        const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        // CORREGIDO: Usamos nombre_dia (con minúscula como está en C# en modelos.cs)
        diasNombres.forEach(n => newSemana.listaDias.push({ nombre_dia: n, kcal: 0, activo: true, listaEjercicios: [] }));

        store.cicloEditando.listaSemanas.push(newSemana);
        UIController.renderSemanas();
    }

    static async handleDeleteSemana(sIdx) {
        if (!confirm('¿Estás seguro de que quieres borrar esta semana? Esta acción es irreversible.')) return;
        
        const store = AppStore.getInstance();
        const semana = store.cicloEditando.listaSemanas[sIdx];
        
        // Si la semana ya existe en la base de datos (tiene ID), la borramos del servidor
        const idSemana = semana.Id_Semana || semana.id_Semana || 0;
        if (idSemana > 0) {
            try {
                await ApiService.deleteSemana(idSemana);
                // Recargamos el perfil para mantenerlo en sincronía (opcional pero seguro)
                const perfil = await ApiService.getPerfil(store.cliente.id_Cliente);
                store.setSesion(store.token, perfil);
            } catch (error) {
                alert("No se pudo borrar la semana en el servidor: " + error.message);
                return; // Abortamos si falla
            }
        }

        // La borramos de la interfaz localmente
        store.cicloEditando.listaSemanas.splice(sIdx, 1);
        
        // Actualizamos las posiciones de las semanas restantes
        store.cicloEditando.listaSemanas.forEach((sem, index) => {
            sem.posicion = index;
        });
        
        UIController.renderSemanas();
    }

    // --- LOGICA DE REGISTRAR ---
    static async handleRegister(e) {
        e.preventDefault();
        const id = document.getElementById('register-id').value;
        const pwd = document.getElementById('register-pwd').value;
        const msg = document.getElementById('register-msg');

        try {
            msg.style.display = 'none';
            await ApiService.registrar(id, pwd);

            // Si tiene éxito, informamos y mandamos al login
            alert("Usuario creado con éxito. Ya puedes iniciar sesión.");
            UIController.switchView('login-view');
        } catch (error) {
            msg.textContent = "Error: " + error.message;
            msg.style.display = 'block';
            msg.style.color = 'red';
        }
    }
}