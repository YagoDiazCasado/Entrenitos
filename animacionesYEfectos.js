// animacionesYEfectos.js — Sistema completo de animación y temas

class Animaciones {

    static init() {
        this.initClickFeedback();
        this.initThemeManager();
        this.initThemePanel();
    }

    // =====================================================================
    // 1. FEEDBACK DE CLIC (HAPTIC VISUAL)
    // =====================================================================
   static initClickFeedback() {
        const selector = 'button, .clickable, .semana-header, .dia-card';

        // Animación suave de "hundimiento" mejorada
        document.body.addEventListener('mousedown', (e) => {
            const target = e.target.closest(selector);
            if (target) {
                target.style.transform = 'scale(0.97)';
                target.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)'; // Más lento y suave
            }
        });

        ['mouseup', 'mouseleave', 'touchend'].forEach(evt => {
            document.body.addEventListener(evt, (e) => {
                const target = e.target.closest(selector);
                if (target) {
                    target.style.transform = 'scale(1)';
                }
            });
        });
    }

    static toggleCollapse(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;

        // Limpiamos los temporizadores si haces clic súper rápido
        clearTimeout(el.animTimeout);

        if (el.classList.contains('open')) {
            // CERRAR
            // 1. Fijamos la altura estática exacta en píxeles
            el.style.maxHeight = el.scrollHeight + 'px'; 
            
            // 2. Forzamos al navegador a procesar esa altura antes de cambiarla a 0 (vital para que funcione la transición)
            void el.offsetHeight; 
            
            // 3. Colapsamos a cero
            el.style.maxHeight = '0px';
            el.style.opacity = '0';
            el.style.margin = '0';
            el.classList.remove('open');
        } else {
            // ABRIR
            el.classList.add('open');
            el.style.opacity = '1';
            el.style.marginTop = '1rem';
            
            // 1. Calculamos lo que ocupa todo el contenido interior
            el.style.maxHeight = el.scrollHeight + 'px';
            
            // 2. Al acabar la animación (400ms), quitamos el candado de altura por si el usuario añade nuevos ejercicios para que siga creciendo
            el.animTimeout = setTimeout(() => {
                if (el.classList.contains('open')) {
                    el.style.maxHeight = 'none';
                }
            }, 400); 
        }
    }

    /**
     * Despliega un elemento via el toggle de clase.
     * Acepta un elemento DOM o el patrón de clic inline.
     */
    static expandDiasContainer(semBlock) {
        const cont = semBlock.querySelector('.dias-container');
        const icon = semBlock.querySelector('.semana-expand-icon');
        if (!cont) return;

        const nowOpen = cont.classList.toggle('expanded');
        if (icon) icon.style.transform = nowOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    }

    // Modal con animación CSS
    static openModal(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.style.display = 'flex';
        // Reflow para que la transición arranque
        void el.offsetWidth;
        el.classList.add('open');
    }

    static closeModal(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.classList.remove('open');
        setTimeout(() => { el.style.display = 'none'; }, 320);
    }

    // Anima la entrada de la vista de semana completa
    static animateVistaSemana(container) {
        if (!container) return;
        const wrapper = container.querySelector('.vista-semana-wrapper');
        if (!wrapper) return;
        // Fuerza repaint antes de añadir la clase
        void wrapper.offsetWidth;
        wrapper.classList.add('reveal');
    }

    // Anima la salida de la vista semana (antes de ocultarla)
    static hideVistaSemana(container, callback) {
        if (!container) return callback?.();
        const wrapper = container.querySelector('.vista-semana-wrapper');
        if (!wrapper) return callback?.();

        wrapper.classList.remove('reveal');
        setTimeout(() => callback?.(), 280);
    }

    // =====================================================================
    // 3. GESTOR DE TEMAS
    // =====================================================================
    static themes = [
        {
            name: "Night Fuel",
            swatch: "#e8ff47",
            vars: {
                '--md-bg':                   '#0d0f14',
                '--md-surface':              '#161a23',
                '--md-surface-variant':      '#1e2330',
                '--md-primary':              '#e8ff47',
                '--md-on-primary':           '#0d0f14',
                '--md-primary-container':    '#2a2e1a',
                '--md-on-primary-container': '#e8ff47',
                '--md-secondary-container':  '#1e2330',
                '--md-on-secondary-container':'#c5cfe8',
                '--md-text':                 '#eef0f6',
                '--md-text-muted':           '#6b748a',
                '--md-outline':              '#2e3347',
                '--md-success-container':    '#1a3329',
                '--md-on-success-container': '#52e8a0',
                '--md-danger':               '#ff4d5e',
                '--md-danger-container':     '#2e1519',
                '--md-on-danger-container':  '#ff8a93',
                '--glow-primary':            '0 0 18px rgba(232,255,71,.25)',
            }
        },
        {
            name: "Solar Punch",
            swatch: "#ff6b35",
            vars: {
                '--md-bg':                   '#0f0a08',
                '--md-surface':              '#1a1209',
                '--md-surface-variant':      '#241a0d',
                '--md-primary':              '#ff6b35',
                '--md-on-primary':           '#0f0a08',
                '--md-primary-container':    '#2d1509',
                '--md-on-primary-container': '#ff9966',
                '--md-secondary-container':  '#1e1a14',
                '--md-on-secondary-container':'#d4c4b0',
                '--md-text':                 '#f5ede6',
                '--md-text-muted':           '#7a6860',
                '--md-outline':              '#322618',
                '--md-success-container':    '#1a2e1e',
                '--md-on-success-container': '#52c87a',
                '--md-danger':               '#ff3333',
                '--md-danger-container':     '#2e1010',
                '--md-on-danger-container':  '#ff8888',
                '--glow-primary':            '0 0 18px rgba(255,107,53,.3)',
            }
        },
        {
            name: "Cryo Blue",
            swatch: "#00d4ff",
            vars: {
                '--md-bg':                   '#060c14',
                '--md-surface':              '#0a1220',
                '--md-surface-variant':      '#101c2e',
                '--md-primary':              '#00d4ff',
                '--md-on-primary':           '#060c14',
                '--md-primary-container':    '#001e2e',
                '--md-on-primary-container': '#7ee8ff',
                '--md-secondary-container':  '#101c2e',
                '--md-on-secondary-container':'#b0cce0',
                '--md-text':                 '#dff2ff',
                '--md-text-muted':           '#527a92',
                '--md-outline':              '#142030',
                '--md-success-container':    '#0e2820',
                '--md-on-success-container': '#40e8a0',
                '--md-danger':               '#ff4466',
                '--md-danger-container':     '#200818',
                '--md-on-danger-container':  '#ff88aa',
                '--glow-primary':            '0 0 18px rgba(0,212,255,.25)',
            }
        },
        {
            name: "Limelight",
            swatch: "#b8ff6e",
            vars: {
                '--md-bg':                   '#f5f7f2',
                '--md-surface':              '#ffffff',
                '--md-surface-variant':      '#e8ede2',
                '--md-primary':              '#3a7d1e',
                '--md-on-primary':           '#ffffff',
                '--md-primary-container':    '#c8f0a8',
                '--md-on-primary-container': '#0e3000',
                '--md-secondary-container':  '#e0edd8',
                '--md-on-secondary-container':'#1e3010',
                '--md-text':                 '#161e0e',
                '--md-text-muted':           '#5a7048',
                '--md-outline':              '#ccd8c0',
                '--md-success-container':    '#d0f5d0',
                '--md-on-success-container': '#063a10',
                '--md-danger':               '#c0350a',
                '--md-danger-container':     '#ffe5de',
                '--md-on-danger-container':  '#7a1000',
                '--glow-primary':            '0 0 16px rgba(58,125,30,.15)',
            }
        },
        {
            name: "Neon Violet",
            swatch: "#c77dff",
            vars: {
                '--md-bg':                   '#080611',
                '--md-surface':              '#100e1c',
                '--md-surface-variant':      '#17142a',
                '--md-primary':              '#c77dff',
                '--md-on-primary':           '#080611',
                '--md-primary-container':    '#1e1040',
                '--md-on-primary-container': '#c77dff',
                '--md-secondary-container':  '#17142a',
                '--md-on-secondary-container':'#c0b8e0',
                '--md-text':                 '#ede8ff',
                '--md-text-muted':           '#6e688a',
                '--md-outline':              '#251f3e',
                '--md-success-container':    '#0e2028',
                '--md-on-success-container': '#60e0c8',
                '--md-danger':               '#ff5577',
                '--md-danger-container':     '#200820',
                '--md-on-danger-container':  '#ff9ab0',
                '--glow-primary':            '0 0 20px rgba(199,125,255,.3)',
            }
        }
    ];

    static currentThemeIdx = 0;

    static initThemeManager() {
        const saved = localStorage.getItem('entrenitos_theme_idx');
        if (saved !== null) this.currentThemeIdx = parseInt(saved);
        this.applyTheme();
    }

    static setTheme(idx) {
        this.currentThemeIdx = idx;
        localStorage.setItem('entrenitos_theme_idx', idx);
        this.applyTheme();
        this.updateThemeMenu();
    }

    // Legacy: ciclo rápido (no usado por el panel pero mantiene compatibilidad)
    static toggleTheme() {
        this.setTheme((this.currentThemeIdx + 1) % this.themes.length);
    }

    static applyTheme() {
        const theme = this.themes[this.currentThemeIdx];
        const root  = document.documentElement;
        Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    }

    // =====================================================================
    // 4. PANEL DE TEMAS (UI)
    // =====================================================================
    static initThemePanel() {
        // Crear panel si no existe
        if (document.getElementById('theme-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'theme-panel';
        panel.innerHTML = `
            <div id="theme-menu" role="menu" aria-label="Temas de color">
                ${this.themes.map((t, i) => `
                    <div class="theme-option${i === this.currentThemeIdx ? ' active' : ''}"
                         role="menuitem" data-idx="${i}"
                         onclick="Animaciones.setTheme(${i}); document.getElementById('theme-menu').classList.remove('open');">
                        <span class="theme-swatch" style="background:${t.swatch};"></span>
                        ${t.name}
                    </div>`).join('')}
            </div>
            <button id="btn-theme-toggle" title="Cambiar tema" aria-label="Cambiar tema de color">🎨</button>
        `;
        document.body.appendChild(panel);

        document.getElementById('btn-theme-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('theme-menu').classList.toggle('open');
        });

        // Cerrar al clicar fuera
        document.addEventListener('click', () => {
            document.getElementById('theme-menu')?.classList.remove('open');
        });
    }

    static updateThemeMenu() {
        document.querySelectorAll('#theme-menu .theme-option').forEach((el, i) => {
            el.classList.toggle('active', i === this.currentThemeIdx);
        });
    }
}
