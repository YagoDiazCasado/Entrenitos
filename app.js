// ==========================================
// 1. STORE (SINGLETON)
// ==========================================
class AppStore {
    static instance = null;

    constructor() {
        if (AppStore.instance) return AppStore.instance;
        this.token = sessionStorage.getItem('entrenitos_token') || null;
        this.cliente = JSON.parse(sessionStorage.getItem('entrenitos_cliente')) || null;
        this.cicloEditando = null;
        AppStore.instance = this;
    }

    static getInstance() {
        if (!AppStore.instance) new AppStore();
        return AppStore.instance;
    }

    setSesion(token, cliente) {
        this.token = token;
        this.cliente = cliente;
        sessionStorage.setItem('entrenitos_token', token);
        sessionStorage.setItem('entrenitos_cliente', JSON.stringify(cliente));
    }

    cerrarSesion() {
        this.token = null;
        this.cliente = null;
        sessionStorage.clear();
    }
}

// ==========================================
// 2. API SERVICE (STATIC)
// ==========================================
class ApiService {
    static BASE_URL = 'http://localhost:5021/api/Entrenitos'; // Ajustar puerto según IIS/Kestrel

    static async fetchWithAuth(endpoint, method = 'GET', body = null) {
        const store = AppStore.getInstance();
        const headers = { 'Content-Type': 'application/json' };
        if (store.token) headers['Authorization'] = `Bearer ${store.token}`;

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${this.BASE_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    }

    static async login(id, password) {
        return this.fetchWithAuth('/Login', 'POST', { id_Cliente: id, password: password });
    }

    // Dentro de la clase ApiService
    static async registrar(id, password) {
        return this.fetchWithAuth('/PostCliente', 'POST', { id_Cliente: id, password: password });
    }

    static async getPerfil(id) {
        return this.fetchWithAuth(`/GetCliente/${id}`);
    }

    static async saveCiclo(id, ciclo) {
        return this.fetchWithAuth(`/PostCiclo/${id}`, 'POST', ciclo);
    }

    static async deleteSemana(idSemana) {
        return this.fetchWithAuth(`/DeleteSemana/${idSemana}`, 'DELETE');
    }

    static async deleteCiclo(id) {
        return this.fetchWithAuth(`/DeleteCiclo/${id}`, 'DELETE');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => UIController.init());