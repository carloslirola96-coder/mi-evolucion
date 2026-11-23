/**
 * MI EVOLUCIÓN - Coordinador Principal de la Aplicación y Enrutamiento de Vistas
 */

class Application {
  constructor() {
    this.currentTab = 'inicio';
    this.currentCoachTopic = 'entrenamiento';
    this.coachChatsByTopic = {
      entrenamiento: [],
      nutricion: [],
      lumbar: [],
      padel: [],
      libre: []
    };
    this.coachLoadingByTopic = {};
  }

  init() {
    this.checkUrlApiKey();
    this.setupTheme();
    this.bindEvents();
    this.switchTab('inicio');
    WorkoutEngine.init();
  }

  // Permite configurar la clave desde el PC enviándote un enlace a ti mismo (1 solo clic, sin escribir en el móvil)
  checkUrlApiKey() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('key')) {
        const key = params.get('key').trim();
        if (key) {
          const settings = window.AppStore.getSettings();
          settings.geminiApiKey = key;
          window.AppStore.saveSettings(settings);
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => alert("¡Clave de IA configurada con éxito en tu móvil! Ya puedes analizar tus platos con fotos."), 400);
        }
      }
    } catch (e) {
      console.warn("Error leyendo URL params:", e);
    }
  }

  setupTheme() {
    // Modo oscuro deportivo de alto contraste por defecto
    document.documentElement.classList.add('dark');
  }

  bindEvents() {
    window.addEventListener('store-updated', () => {
      this.renderCurrentTab();
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Actualizar botones de navegación inferior
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabName;
      if (isTarget) {
        btn.classList.add('text-[var(--primary)]');
        btn.classList.remove('text-[var(--muted-foreground)]');
      } else {
        btn.classList.remove('text-[var(--primary)]');
        btn.classList.add('text-[var(--muted-foreground)]');
      }
    });

    this.renderCurrentTab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCurrentTab() {
    const main = document.getElementById('main-content');
    if (!main) return;

    switch (this.currentTab) {
      case 'inicio':
        this.renderInicio(main);
        break;
      case 'entrenar':
        this.renderEntrenar(main);
        break;
      case 'nutricion':
        this.renderNutricion(main);
        break;
      case 'evolucion':
        this.renderEvolucion(main);
        break;
      case 'entrenador':
        this.renderEntrenador(main);
        break;
      case 'perfil':
        this.renderPerfil(main);
        break;
      default:
        this.renderInicio(main);
    }
  }

  // --- VISTA 1: INICIO ---
  renderInicio(container) {
    const profile = window.AppStore.getProfile();
    const nutrition = window.NutritionEngine.getDailySummary();
    const sessions = window.AppStore.getSessions();
    const routines = window.AppStore.getRoutines();
    const activeWorkout = window.AppStore.getActiveWorkout();

    const lastSession = sessions.length > 0 ? sessions[0] : null;

    container.innerHTML = `
      <div class="space-y-5 pb-24">
        <!-- Encabezado con perfil y estado -->
        <div class="flex items-center justify-between pt-1">
          <div>
            <span class="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Plan Integral • 12 Meses</span>
            <h1 class="text-2xl font-black tracking-tight">Hola, ${profile.name} 👋</h1>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold">
              ${profile.weight} kg
            </span>
            <button onclick="MainApp.switchTab('perfil')" class="w-9 h-9 rounded-xl bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center text-sm">
              ⚙️
            </button>
          </div>
        </div>

        <!-- Banner de reanudación si hay entrenamiento en curso -->
        ${activeWorkout && activeWorkout.status === 'in_progress' ? `
          <div class="bg-[var(--primary)] text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-pulse">
            <div>
              <span class="text-xs font-semibold opacity-90 block">Sesión en progreso activa</span>
              <h3 class="font-bold text-sm">${activeWorkout.routineName}</h3>
            </div>
            <button onclick="WorkoutEngine.renderLiveWorkoutModal()" class="px-4 py-2 bg-white text-black font-black text-xs rounded-xl shadow">
              CONTINUAR
            </button>
          </div>
        ` : ''}

        <!-- Tarjeta: ¿Qué me toca hoy? -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-sm">🏋️</span>
              <h3 class="font-bold text-sm">¿Qué me toca hoy?</h3>
            </div>
            <span class="text-xs text-[var(--muted-foreground)]">3 días / semana</span>
          </div>

          <div class="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] space-y-2">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-sm text-[var(--foreground)]">DÍA A: Pectoral, Espalda y Tren Inferior</h4>
                <p class="text-xs text-[var(--muted-foreground)]">Máx 60 min • Máquinas con apoyo esternal</p>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Revisión funcional
              </span>
            </div>
            <div class="flex gap-2 pt-1">
              <button onclick="WorkoutEngine.startWorkout('rutina_dia_a')" class="flex-1 py-2.5 bg-[var(--primary)] text-white font-bold text-xs rounded-xl shadow active:scale-95 transition">
                Iniciar en Gimnasio
              </button>
              <button onclick="WorkoutEngine.startWorkout('rutina_core_espalda')" class="py-2.5 px-3 bg-[var(--card)] border border-[var(--card-border)] text-xs font-semibold rounded-xl text-emerald-400">
                Core (8 min)
              </button>
            </div>
          </div>
        </div>

        <!-- Tarjeta: Estado de Recuperación Lumbar y Precauciones -->
        <div class="bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-500/20 rounded-2xl p-4 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span> Columna Lumbar (L2-S1)
            </span>
            <span class="text-[10px] text-blue-300/80">Fase: Fortalecimiento</span>
          </div>
          <p class="text-xs text-[var(--foreground)] leading-relaxed">
            Mejoría progresiva sin dolor irradiado. Caminar se tolera bien. Mantén la regla de evitar flexión lumbar forzada con peso.
          </p>
          <div class="flex items-center justify-between pt-1 border-t border-blue-500/10 text-[11px]">
            <span class="text-[var(--muted-foreground)]">Hombro derecho: <strong>Ajuste SLAP 30°</strong></span>
            <button onclick="MainApp.switchTab('entrenador')" class="text-blue-400 font-bold hover:underline">Consultar IA →</button>
          </div>
        </div>

        <!-- Tarjeta: Nutrición y Proteínas del Día -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-sm">🥗</span>
              <h3 class="font-bold text-sm">Alimentación de Hoy</h3>
            </div>
            <button onclick="MainApp.switchTab('nutricion')" class="text-xs text-[var(--primary)] font-bold">Ver detalle</button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-[var(--muted-foreground)]">Proteínas</span>
                <span class="font-bold font-mono text-emerald-400">${nutrition.protein.consumed} / ${nutrition.protein.target}g</span>
              </div>
              <div class="w-full bg-[var(--card-border)] h-2 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full transition-all" style="width: ${Math.min(100, (nutrition.protein.consumed / nutrition.protein.target) * 100)}%"></div>
              </div>
              <span class="text-[10px] text-[var(--muted-foreground)] block mt-1">Faltan: ${nutrition.protein.remaining}g (1.9 g/kg)</span>
            </div>

            <div class="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-[var(--muted-foreground)]">Calorías</span>
                <span class="font-bold font-mono text-amber-400">${nutrition.calories.consumed} / ${nutrition.calories.target}</span>
              </div>
              <div class="w-full bg-[var(--card-border)] h-2 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full transition-all" style="width: ${Math.min(100, (nutrition.calories.consumed / nutrition.calories.target) * 100)}%"></div>
              </div>
              <span class="text-[10px] text-[var(--muted-foreground)] block mt-1">Disponible: ${nutrition.calories.remaining} kcal</span>
            </div>
          </div>

          <!-- Alerta de restricciones -->
          <div class="text-[11px] p-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl flex items-center gap-1.5">
            <span>🌾</span> 100% Sin Gluten (Celiaquía) • Sin Lactosa • Hernia Hiato
          </div>
        </div>

        <!-- Tarjeta: Última sesión realizada -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-2 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm">Último Entrenamiento Registrado</h3>
            <button onclick="MainApp.switchTab('entrenar')" class="text-xs text-[var(--primary)] font-bold">Historial</button>
          </div>
          ${lastSession ? `
            <div class="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] text-xs space-y-1">
              <div class="flex justify-between font-bold">
                <span>${lastSession.routineName}</span>
                <span class="text-emerald-400 font-mono">${lastSession.durationMinutes} min</span>
              </div>
              <p class="text-[var(--muted-foreground)]">
                ${lastSession.totalSetsCompleted} series completadas • ${lastSession.totalVolumeKg.toLocaleString()} kg de volumen total
              </p>
            </div>
          ` : `
            <p class="text-xs text-[var(--muted-foreground)] p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
              Aún no has registrado ningún entrenamiento completo. Pulsa "Iniciar en Gimnasio" o la rutina de "Core" para registrar la primera sesión.
            </p>
          `}
        </div>
      </div>
    `;
  }

  // --- VISTA 2: ENTRENAR ---
  renderEntrenar(container) {
    const routines = window.AppStore.getRoutines();
    const sessions = window.AppStore.getSessions();
    const weeklyVolume = window.ClinicalRules.calculateWeeklyVolume(sessions);

    container.innerHTML = `
      <div class="space-y-5 pb-24">
        <div class="flex items-center justify-between pt-1">
          <div>
            <span class="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Módulo de Entrenamiento</span>
            <h1 class="text-2xl font-black">Mis Rutinas</h1>
          </div>
          <button onclick="MainApp.showCreateRoutineModal()" class="px-3.5 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl shadow flex items-center gap-1">
            <span>+</span> Nueva Rutina
          </button>
        </div>

        <!-- Pestañas de categorías -->
        <div class="space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Programas de Gimnasio (3 Días)</h3>
          
          ${routines.filter(r => r.category === 'Gimnasio').map(r => `
            <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3 shadow-sm">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-base text-[var(--foreground)]">${r.name}</h4>
                  </div>
                  <p class="text-xs text-[var(--muted-foreground)] mt-0.5">${r.notes}</p>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  ${r.statusBadge}
                </span>
              </div>

              <!-- Lista de ejercicios previsualizados -->
              <div class="divide-y divide-[var(--card-border)] bg-[var(--background)] rounded-xl border border-[var(--card-border)] px-3 text-xs">
                ${r.exercises.map((ex, i) => {
                  const exData = window.AppStore.getExerciseById(ex.exerciseId) || { name: "Ejercicio" };
                  return `
                    <div class="py-2 flex items-center justify-between">
                      <span class="font-medium truncate max-w-[200px]">${i + 1}. ${exData.name}</span>
                      <span class="font-mono text-[var(--muted-foreground)] text-[11px]">${ex.targetSets} × ${ex.targetReps} @ ${ex.targetWeight}kg</span>
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="flex gap-2 pt-1">
                <button onclick="WorkoutEngine.startWorkout('${r.id}')" class="flex-1 py-3 bg-[var(--primary)] text-white font-bold text-xs rounded-xl shadow active:scale-95 transition">
                  INICIAR ENTRENAMIENTO
                </button>
                <button onclick="MainApp.editRoutine('${r.id}')" class="px-3.5 py-3 border border-[var(--card-border)] bg-[var(--background)] text-xs font-semibold rounded-xl text-[var(--muted-foreground)]">
                  Editar
                </button>
              </div>
            </div>
          `).join('')}

          <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] pt-3">Recuperación Vertebral y Core</h3>

          ${routines.filter(r => r.category === 'Doméstica').map(r => `
            <div class="bg-[var(--card)] border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-sm bg-gradient-to-br from-emerald-950/20 to-transparent">
              <div class="flex items-start justify-between">
                <div>
                  <h4 class="font-bold text-base text-[var(--foreground)]">${r.name}</h4>
                  <p class="text-xs text-[var(--muted-foreground)] mt-0.5">${r.notes}</p>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ${r.estimatedMinutes} min
                </span>
              </div>

              <div class="divide-y divide-[var(--card-border)] bg-[var(--background)] rounded-xl border border-[var(--card-border)] px-3 text-xs">
                ${r.exercises.map((ex, i) => {
                  const exData = window.AppStore.getExerciseById(ex.exerciseId) || { name: "Ejercicio" };
                  return `
                    <div class="py-2 flex items-center justify-between">
                      <span class="font-medium">${i + 1}. ${exData.name}</span>
                      <span class="font-mono text-emerald-400 text-[11px]">${ex.targetSets} × ${ex.targetReps}</span>
                    </div>
                  `;
                }).join('')}
              </div>

              <button onclick="WorkoutEngine.startWorkout('${r.id}')" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition">
                INICIAR RUTINA DOMÉSTICA (5-10 MIN)
              </button>
            </div>
          `).join('')}
        </div>

        <!-- Historial reciente -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
          <h3 class="font-bold text-sm">Historial de Sesiones</h3>
          ${sessions.length === 0 ? `
            <p class="text-xs text-[var(--muted-foreground)]">No hay entrenamientos guardados aún.</p>
          ` : `
            <div class="space-y-2">
              ${sessions.slice(0, 5).map(s => `
                <div class="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex items-center justify-between text-xs">
                  <div>
                    <h5 class="font-bold">${s.routineName}</h5>
                    <span class="text-[10px] text-[var(--muted-foreground)]">${new Date(s.endTime).toLocaleDateString()} • ${s.durationMinutes} min</span>
                  </div>
                  <div class="text-right">
                    <span class="font-mono font-bold text-amber-400">${s.totalVolumeKg.toLocaleString()} kg</span>
                    <span class="text-[10px] text-[var(--muted-foreground)] block">${s.totalSetsCompleted} series</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  // --- VISTA 3: NUTRICIÓN ---
  renderNutricion(container) {
    const nutrition = window.NutritionEngine.getDailySummary();
    const foods = window.NutritionEngine.getCommonSpanishFoods();

    container.innerHTML = `
      <div class="space-y-5 pb-24">
        <div class="flex items-center justify-between pt-1">
          <div>
            <span class="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Módulo de Nutrición</span>
            <h1 class="text-2xl font-black">Registro Diario</h1>
          </div>
          <button onclick="MainApp.openAddMealModal()" class="px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1">
            <span>📷</span> Añadir Comida
          </button>
        </div>

        <!-- Panel de macronutrientes del día -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-4 shadow-sm">
          <div class="text-center">
            <span class="text-xs text-[var(--muted-foreground)] font-medium">Calorías Totales</span>
            <div class="text-3xl font-black font-mono text-amber-400 mt-0.5">
              ${nutrition.calories.consumed} <span class="text-sm font-normal text-[var(--muted-foreground)]">/ ${nutrition.calories.target} kcal</span>
            </div>
            <span class="text-xs text-[var(--muted-foreground)]">Restan ${nutrition.calories.remaining} kcal para tu objetivo</span>
          </div>

          <!-- Barras de 3 macros -->
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
              <span class="text-[11px] text-[var(--muted-foreground)] block">Proteínas</span>
              <span class="font-mono font-bold text-emerald-400 text-sm">${nutrition.protein.consumed}g</span>
              <span class="text-[10px] text-[var(--muted-foreground)] block">Meta: ${nutrition.protein.target}g</span>
            </div>
            <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
              <span class="text-[11px] text-[var(--muted-foreground)] block">Hidratos</span>
              <span class="font-mono font-bold text-blue-400 text-sm">${nutrition.carbs.consumed}g</span>
              <span class="text-[10px] text-[var(--muted-foreground)] block">Meta: ${nutrition.carbs.target}g</span>
            </div>
            <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
              <span class="text-[11px] text-[var(--muted-foreground)] block">Grasas</span>
              <span class="font-mono font-bold text-purple-400 text-sm">${nutrition.fat.consumed}g</span>
              <span class="text-[10px] text-[var(--muted-foreground)] block">Meta: ${nutrition.fat.target}g</span>
            </div>
          </div>

          <!-- Cuadro informativo clínico -->
          <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1 text-amber-200">
            <div class="flex items-center gap-1.5 font-bold">
              <span>🌾</span> Filtro de Seguridad Alimentaria
            </div>
            <p class="text-[11px] text-amber-300/80">
              Protocolo para celiaquía: nunca validar un plato únicamente por foto sin verificar trazabilidad o contaminación cruzada en cocina/bar.
            </p>
          </div>
        </div>

        <!-- Comidas registradas hoy -->
        <div class="space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Comidas de Hoy</h3>
          
          ${nutrition.meals.length === 0 ? `
            <div class="p-6 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl text-center text-xs text-[var(--muted-foreground)]">
              No hay comidas registradas hoy. Pulsa "Añadir Comida" para fotografiar tu plato o añadirlo manualmente.
            </div>
          ` : `
            <div class="space-y-2.5">
              ${nutrition.meals.map(m => `
                <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-3.5 space-y-2 shadow-sm">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">${m.mealType} • ${m.time}</span>
                      <h4 class="font-bold text-sm text-[var(--foreground)]">${m.name}</h4>
                    </div>
                    <div class="text-right">
                      <span class="font-mono font-bold text-amber-400 text-sm">${m.estimatedCalories} kcal</span>
                      <span class="text-[10px] font-mono font-semibold text-emerald-400 block">${m.protein}g proteína</span>
                    </div>
                  </div>

                  ${m.items && m.items.length > 0 ? `
                    <div class="bg-[var(--background)] p-2 rounded-xl text-[11px] text-[var(--muted-foreground)] space-y-0.5">
                      ${m.items.map(it => `
                        <div class="flex justify-between">
                          <span>• ${it.name} (${it.amount || it.estimatedPortion || ''})</span>
                          <span class="font-mono">${it.prot || it.protein || 0}g P</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Catálogo rápido de alimentos seguros españoles para Carlo -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
          <h3 class="font-bold text-sm">Alimentos Clave para Cenas Rápidas (Sin Cocinar)</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            ${foods.slice(0, 4).map(f => `
              <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <span class="font-bold block">${f.name}</span>
                  <span class="text-[10px] text-[var(--muted-foreground)]">${f.unit} • ${f.prot}g prot</span>
                </div>
                <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">Sin Gluten</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // --- VISTA 4: EVOLUCIÓN ---
  renderEvolucion(container) {
    const profile = window.AppStore.getProfile();
    const logs = [...window.AppStore.getEvolutionLog()].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const sessions = window.AppStore.getSessions();
    const weeklyVol = window.ClinicalRules.calculateWeeklyVolume(sessions);

    const latest = logs.length > 0 ? logs[0] : null;
    const previous = logs.length > 1 ? logs[1] : null;

    const currentWeight = latest && latest.weight != null ? latest.weight : profile.weight;
    const currentWaist = latest && latest.waist != null ? latest.waist : null;

    const weightDiff = (latest && previous && latest.weight != null && previous.weight != null)
      ? (latest.weight - previous.weight).toFixed(1)
      : null;
    const waistDiff = (latest && previous && latest.waist != null && previous.waist != null)
      ? (latest.waist - previous.waist).toFixed(1)
      : null;

    container.innerHTML = `
      <div class="space-y-5 pb-24">
        <div class="flex items-center justify-between pt-1">
          <div>
            <span class="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Módulo de Evolución</span>
            <h1 class="text-2xl font-black">Progreso y Métricas</h1>
          </div>
          <button onclick="MainApp.openAddEvolutionModal()" class="px-3.5 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl shadow flex items-center gap-1 active:scale-95 transition">
            <span>+</span> Registrar Medida
          </button>
        </div>

        <!-- Resumen de Composición Corporal -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
            <span class="text-xs text-[var(--muted-foreground)]">Peso Corporal</span>
            <div class="text-3xl font-black font-mono text-[var(--foreground)] mt-0.5">${currentWeight != null ? `${currentWeight} kg` : '-- kg'}</div>
            <span class="text-[10px] ${weightDiff !== null ? 'text-blue-400' : 'text-emerald-400'} font-semibold">
              ${weightDiff !== null ? `${Number(weightDiff) > 0 ? '+' : ''}${weightDiff} kg vs anterior` : (latest ? `Última: ${latest.date}` : 'Objetivo: Masa magra')}
            </span>
          </div>

          <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
            <span class="text-xs text-[var(--muted-foreground)]">Perímetro Cintura</span>
            <div class="text-3xl font-black font-mono text-amber-400 mt-0.5">${currentWaist != null ? `${currentWaist} cm` : '-- cm'}</div>
            <span class="text-[10px] text-[var(--muted-foreground)]">
              ${waistDiff !== null ? `${Number(waistDiff) > 0 ? '+' : ''}${waistDiff} cm vs anterior` : (latest && latest.waist != null ? `Última: ${latest.date}` : 'Sin mediciones aún')}
            </span>
          </div>
        </div>

        <!-- Historial de Mediciones Registradas -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm">Historial de Mediciones</h3>
            <span class="text-[11px] text-[var(--muted-foreground)]">${logs.length} registro${logs.length === 1 ? '' : 's'}</span>
          </div>

          ${logs.length === 0 ? `
            <p class="text-xs text-[var(--muted-foreground)] text-center py-3">
              Aún no has registrado ninguna medida. Pulsa "+ Registrar Medida" para añadir la primera.
            </p>
          ` : `
            <div class="space-y-2">
              ${logs.map(entry => `
                <div class="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] text-xs space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-[var(--primary)]">${entry.date || 'Sin fecha'}</span>
                    <button onclick="MainApp.deleteEvolutionEntry('${entry.id}')" class="text-[10px] text-red-400 hover:underline font-semibold">
                      Eliminar
                    </button>
                  </div>
                  <div class="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px]">
                    ${entry.weight != null ? `<span>Peso: <strong>${entry.weight} kg</strong></span>` : ''}
                    ${entry.waist != null ? `<span class="text-amber-400">Cintura: <strong>${entry.waist} cm</strong></span>` : ''}
                    ${entry.chest != null ? `<span>Pecho: <strong>${entry.chest} cm</strong></span>` : ''}
                    ${entry.armRight != null ? `<span>Brazo: <strong>${entry.armRight} cm</strong></span>` : ''}
                    ${entry.thighRight != null ? `<span>Muslo: <strong>${entry.thighRight} cm</strong></span>` : ''}
                  </div>
                  ${(entry.painLumbarScore != null || entry.painShoulderScore != null) ? `
                    <div class="text-[10px] text-[var(--muted-foreground)] flex gap-3">
                      ${entry.painLumbarScore != null ? `<span>Lumbar: <strong>${entry.painLumbarScore}/10</strong></span>` : ''}
                      ${entry.painShoulderScore != null ? `<span>Hombro: <strong>${entry.painShoulderScore}/10</strong></span>` : ''}
                    </div>
                  ` : ''}
                  ${entry.notes ? `<p class="text-[11px] text-[var(--muted-foreground)] italic">"${entry.notes}"</p>` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Panel de Volumen Semanal por Grupo Muscular -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm">Series Efectivas Esta Semana</h3>
            <span class="text-xs text-[var(--muted-foreground)]">Guía Schoenfeld</span>
          </div>

          <div class="space-y-2 text-xs">
            ${Object.entries(weeklyVol).map(([muscle, sets]) => `
              <div class="space-y-1">
                <div class="flex justify-between text-[11px]">
                  <span class="font-medium">${muscle}</span>
                  <span class="font-mono font-bold ${sets >= 8 ? 'text-emerald-400' : 'text-[var(--muted-foreground)]'}">${sets} series</span>
                </div>
                <div class="w-full bg-[var(--background)] h-1.5 rounded-full overflow-hidden border border-[var(--card-border)]">
                  <div class="bg-[var(--primary)] h-full rounded-full" style="width: ${Math.min(100, (sets / 14) * 100)}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Guía de Fotografías de Progreso -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm">Fotografías Corporales Comparativas</h3>
            <span class="text-xs text-emerald-400 font-bold">Privado 100% Local</span>
          </div>
          <p class="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Toma fotos frontales, de perfil y posteriores en ayunas, con la misma iluminación natural y distancia.
          </p>
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="aspect-square bg-[var(--background)] rounded-xl border border-dashed border-[var(--card-border)] flex flex-col items-center justify-center p-2">
              <span class="text-xl mb-1">👤</span>
              <span class="text-[10px] text-[var(--muted-foreground)] font-semibold">Frontal</span>
            </div>
            <div class="aspect-square bg-[var(--background)] rounded-xl border border-dashed border-[var(--card-border)] flex flex-col items-center justify-center p-2">
              <span class="text-xl mb-1">🧍</span>
              <span class="text-[10px] text-[var(--muted-foreground)] font-semibold">Perfil</span>
            </div>
            <div class="aspect-square bg-[var(--background)] rounded-xl border border-dashed border-[var(--card-border)] flex flex-col items-center justify-center p-2">
              <span class="text-xl mb-1">🔙</span>
              <span class="text-[10px] text-[var(--muted-foreground)] font-semibold">Posterior</span>
            </div>
          </div>
          <p class="text-[10px] text-amber-300/80 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
            Aviso: Las estimaciones visuales no sustituyen la cinta métrica ni la báscula para medir hipertrofia real.
          </p>
        </div>
      </div>
    `;
  }

  // --- VISTA 5: ENTRENADOR IA ---
  getCoachTopics() {
    return [
      {
        id: 'entrenamiento',
        label: '🎯 Entrenamiento',
        title: 'Plan de Entrenamiento Hoy',
        defaultPrompt: '¿Qué me recomiendas entrenar hoy según mi último entreno y mis lesiones?',
        placeholder: 'Pregunta sobre ejercicios, pesos o rutinas...'
      },
      {
        id: 'nutricion',
        label: '🥗 Cena / Nutrición',
        title: 'Consejo de Cena y Macros',
        defaultPrompt: '¿Qué puedo cenar hoy alto en proteína y sin cocinar, adaptado a mis macros restantes?',
        placeholder: 'Pregunta sobre cenas, proteínas o alimentos sin gluten...'
      },
      {
        id: 'lumbar',
        label: '🛡️ Molestia lumbar',
        title: 'Protocolo Lumbar y Hombro',
        defaultPrompt: 'Tengo algo de molestia lumbar después del día/entreno, ¿qué debo hacer hoy?',
        placeholder: 'Describe tu molestia o pregunta sobre readaptación...'
      },
      {
        id: 'padel',
        label: '🎾 Vuelta al pádel',
        title: 'Progresión para el Pádel',
        defaultPrompt: '¿Cómo voy respecto a mi vuelta al pádel y qué debo cuidar ahora?',
        placeholder: 'Pregunta sobre vuelta a pista o preparación para pádel...'
      },
      {
        id: 'libre',
        label: '💬 Chat libre',
        title: 'Consulta Libre',
        defaultPrompt: null,
        placeholder: 'Escribe cualquier pregunta al Coach IA...'
      }
    ];
  }

  formatCoachMarkdown(text) {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  }

  renderEntrenador(container) {
    const topics = this.getCoachTopics();
    const activeTopic = topics.find(t => t.id === this.currentCoachTopic) || topics[0];
    const messages = this.coachChatsByTopic[activeTopic.id] || [];
    const isLoading = !!this.coachLoadingByTopic[activeTopic.id];
    const profile = window.AppStore.getProfile();

    container.innerHTML = `
      <div class="space-y-3 pb-28 flex flex-col h-[calc(100vh-110px)]">
        <div class="pt-1 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Entrenador y Readaptador IA</span>
            <h1 class="text-2xl font-black">Asistente Personal</h1>
          </div>
          ${messages.length > 0 ? `
            <button onclick="MainApp.refreshCoachTopic('${activeTopic.id}')" class="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-[11px] font-semibold text-[var(--muted-foreground)] hover:border-[var(--primary)]">
              ↻ Actualizar
            </button>
          ` : ''}
        </div>

        <!-- Pestañas de tema: cada selección muestra SOLO su propia consulta -->
        <div class="flex overflow-x-auto gap-2 py-1 no-scrollbar flex-shrink-0">
          ${topics.map(t => {
            const isSelected = t.id === activeTopic.id;
            return `
              <button onclick="MainApp.selectCoachTopic('${t.id}')"
                class="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${isSelected
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow'
                  : 'bg-[var(--card)] text-[var(--foreground)] border-[var(--card-border)] hover:border-[var(--primary)]'}">
                ${t.label}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Cabecera del tema activo -->
        <div class="flex items-center justify-between px-1 text-[11px] text-[var(--muted-foreground)] flex-shrink-0">
          <span class="font-bold text-[var(--foreground)]">${activeTopic.title}</span>
          <span>Conversación separada por tema</span>
        </div>

        <!-- Historial exclusivo del tema seleccionado -->
        <div id="ai-chat-messages" class="flex-1 overflow-y-auto space-y-3 p-3 bg-[var(--card)] rounded-2xl border border-[var(--card-border)] text-xs">
          ${messages.length === 0 && !isLoading ? `
            <div class="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
              <div class="w-10 h-10 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-black text-base">IA</div>
              <div class="space-y-1 max-w-xs">
                <p class="font-bold text-sm text-[var(--foreground)]">${activeTopic.title}</p>
                <p class="text-xs text-[var(--muted-foreground)]">
                  ${activeTopic.defaultPrompt
                    ? `Pulsa el botón para obtener una recomendación personalizada para ${profile.name} sobre este tema, o escribe tu propia pregunta abajo.`
                    : `Haz cualquier consulta libre sobre entrenamientos, lesiones o nutrición.`}
                </p>
              </div>
              ${activeTopic.defaultPrompt ? `
                <button onclick="MainApp.runDefaultCoachTopic('${activeTopic.id}')" class="px-4 py-2.5 bg-[var(--primary)] text-white font-bold text-xs rounded-xl shadow active:scale-95 transition">
                  ✨ Obtener recomendación ahora
                </button>
              ` : ''}
            </div>
          ` : `
            ${messages.map(m => {
              if (m.role === 'user') {
                return `
                  <div class="flex gap-2.5 justify-end">
                    <div class="bg-[var(--primary)] text-white p-3 rounded-2xl rounded-tr-none text-xs max-w-[85%] font-medium">
                      ${this.formatCoachMarkdown(m.text)}
                    </div>
                  </div>
                `;
              }
              const badgeHtml = m.source === 'gemini'
                ? `<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✨ Gemini IA</span>`
                : `<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">⚡ Modo local${m.error ? ` (${m.error})` : ''}</span>`;
              return `
                <div class="flex gap-2.5 items-start">
                  <span class="w-7 h-7 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">IA</span>
                  <div class="bg-[var(--background)] p-3 rounded-2xl rounded-tl-none border border-[var(--card-border)] space-y-1.5 max-w-[85%] text-xs leading-relaxed">
                    <div>${badgeHtml}</div>
                    <div>${this.formatCoachMarkdown(m.text)}</div>
                  </div>
                </div>
              `;
            }).join('')}
            ${isLoading ? `
              <div class="flex gap-2.5 items-start">
                <span class="w-7 h-7 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">IA</span>
                <div class="bg-[var(--background)] p-3 rounded-2xl rounded-tl-none border border-[var(--card-border)] text-xs text-[var(--muted-foreground)] italic animate-pulse">
                  Preparando respuesta de ${activeTopic.title.toLowerCase()}...
                </div>
              </div>
            ` : ''}
          `}
        </div>

        <!-- Input fijo inferior para escribir sobre el tema activo -->
        <div class="flex gap-2 pt-1 flex-shrink-0">
          <input type="text" id="ai-chat-input" placeholder="${activeTopic.placeholder}" 
            onkeydown="if(event.key==='Enter') MainApp.sendCustomCoachMessage()"
            ${isLoading ? 'disabled' : ''}
            class="flex-1 px-4 py-3 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] shadow-sm disabled:opacity-60" />
          <button onclick="MainApp.sendCustomCoachMessage()" ${isLoading ? 'disabled' : ''}
            class="px-5 py-3 bg-[var(--primary)] text-white font-bold text-xs rounded-2xl shadow active:scale-95 transition disabled:opacity-60">
            Enviar
          </button>
        </div>
      </div>
    `;

    const msgBox = document.getElementById('ai-chat-messages');
    if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
  }

  selectCoachTopic(topicId) {
    this.currentCoachTopic = topicId;
    const topics = this.getCoachTopics();
    const topic = topics.find(t => t.id === topicId);
    const messages = this.coachChatsByTopic[topicId] || [];

    this.renderCurrentTab();

    // Si es un tema con consulta predefinida y aún está vacío, lanzarla automáticamente una sola vez
    if (topic && topic.defaultPrompt && messages.length === 0 && !this.coachLoadingByTopic[topicId]) {
      this.sendCoachMessageToTopic(topicId, topic.defaultPrompt);
    }
  }

  runDefaultCoachTopic(topicId) {
    const topic = this.getCoachTopics().find(t => t.id === topicId);
    if (!topic || !topic.defaultPrompt || this.coachLoadingByTopic[topicId]) return;
    this.sendCoachMessageToTopic(topicId, topic.defaultPrompt);
  }

  refreshCoachTopic(topicId) {
    if (this.coachLoadingByTopic[topicId]) return;
    this.coachChatsByTopic[topicId] = [];
    const topic = this.getCoachTopics().find(t => t.id === topicId);
    this.renderCurrentTab();
    if (topic && topic.defaultPrompt) {
      this.sendCoachMessageToTopic(topicId, topic.defaultPrompt);
    }
  }

  async sendCustomCoachMessage() {
    const input = document.getElementById('ai-chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const topicId = this.currentCoachTopic || 'libre';
    if (this.coachLoadingByTopic[topicId]) return;
    input.value = '';
    await this.sendCoachMessageToTopic(topicId, text);
  }

  async sendCoachMessageToTopic(topicId, text) {
    if (!this.coachChatsByTopic[topicId]) {
      this.coachChatsByTopic[topicId] = [];
    }
    this.coachChatsByTopic[topicId].push({ role: 'user', text });
    this.coachLoadingByTopic[topicId] = true;

    if (this.currentTab === 'entrenador' && this.currentCoachTopic === topicId) {
      this.renderCurrentTab();
    }

    try {
      const result = await window.AICoach.askCoach(text, topicId);
      const responseText = typeof result === 'string' ? result : result.text;
      this.coachChatsByTopic[topicId].push({
        role: 'assistant',
        text: responseText,
        source: result.source || 'local',
        error: result.error || null
      });
    } catch (err) {
      this.coachChatsByTopic[topicId].push({
        role: 'assistant',
        text: 'No se pudo obtener respuesta en este momento. Inténtalo de nuevo.',
        source: 'fallback',
        error: err.message
      });
    } finally {
      this.coachLoadingByTopic[topicId] = false;
      if (this.currentTab === 'entrenador' && this.currentCoachTopic === topicId) {
        this.renderCurrentTab();
      }
    }
  }

  // --- VISTA 6: PERFIL Y AJUSTES ---
  renderPerfil(container) {
    const profile = window.AppStore.getProfile();
    const settings = window.AppStore.getSettings();

    container.innerHTML = `
      <div class="space-y-5 pb-24">
        <div class="pt-1">
          <span class="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Configuración y Seguridad</span>
          <h1 class="text-2xl font-black">Ficha Personal</h1>
        </div>

        <!-- Datos personales básicos -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
          <h3 class="font-bold text-sm">Datos Físicos</h3>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
              <span class="text-[var(--muted-foreground)] block">Edad</span>
              <span class="font-bold text-sm">${profile.age} años</span>
            </div>
            <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
              <span class="text-[var(--muted-foreground)] block">Altura</span>
              <span class="font-bold text-sm">${profile.height} cm</span>
            </div>
            <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
              <span class="text-[var(--muted-foreground)] block">Peso Actual</span>
              <span class="font-bold text-sm">${profile.weight} kg</span>
            </div>
            <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
              <span class="text-[var(--muted-foreground)] block">Gimnasio</span>
              <span class="font-bold text-xs truncate block">${profile.gym}</span>
            </div>
          </div>
        </div>

        <!-- Condiciones médicas registradas -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
          <h3 class="font-bold text-sm">Historial Clínico Permanente</h3>
          <div class="space-y-2 text-xs">
            <div class="p-3 bg-[var(--background)] rounded-xl border border-red-500/20 text-red-200">
              <span class="font-bold block text-red-300">🦴 Columna Lumbar</span>
              <p class="text-[11px] text-[var(--muted-foreground)] mt-0.5">${profile.medicalHistory.lumbar.condition} • ${profile.medicalHistory.lumbar.symptoms}</p>
            </div>
            <div class="p-3 bg-[var(--background)] rounded-xl border border-amber-500/20 text-amber-200">
              <span class="font-bold block text-amber-300">💪 Hombro y Brazos</span>
              <p class="text-[11px] text-[var(--muted-foreground)] mt-0.5">${profile.medicalHistory.shoulderRight.condition} • Antecedente inserción tríceps</p>
            </div>
            <div class="p-3 bg-[var(--background)] rounded-xl border border-blue-500/20 text-blue-200">
              <span class="font-bold block text-blue-300">🥗 Digestivo y Sistémico</span>
              <ul class="text-[11px] text-[var(--muted-foreground)] mt-1 list-disc list-inside space-y-0.5">
                ${profile.medicalHistory.systemicAndNutrition.conditions.map(c => `<li>${c}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- Copias de seguridad y privacidad local -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
          <h3 class="font-bold text-sm">Copias de Seguridad (100% Locales)</h3>
          <p class="text-xs text-[var(--muted-foreground)]">
            Tus datos de salud nunca salen de tu dispositivo sin tu consentimiento expreso. Puedes exportar o importar tu archivo JSON completo en cualquier momento.
          </p>
          <div class="flex gap-2">
            <button onclick="MainApp.exportDataBackup()" class="flex-1 py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-bold hover:bg-[var(--card)]">
              Descargar Backup JSON
            </button>
            <button onclick="MainApp.triggerImportBackup()" class="flex-1 py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-bold hover:bg-[var(--card)]">
              Restaurar Backup
            </button>
          </div>
          <input type="file" id="backup-file-input" accept=".json" class="hidden" onchange="MainApp.handleBackupFileSelected(event)" />
        </div>

        <!-- Clave API Opcional para Gemini (Totalmente gratuita) -->
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm">IA Externa (Gemini Flash)</h3>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${settings.geminiApiKey ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}">
              ${settings.geminiApiKey ? 'Clave guardada' : 'Sin clave'}
            </span>
          </div>
          <p class="text-xs text-[var(--muted-foreground)]">
            Para activar el <strong>Coach IA real</strong> y el <strong>análisis de calorías por foto</strong>, consigue una clave gratuita en
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" class="text-[var(--primary)] underline font-semibold">Google AI Studio</a> y pégala aquí:
          </p>
          <input type="password" id="gemini-key-input" placeholder="Pega tu clave de Google AI Studio (AIza...)..." value="${settings.geminiApiKey || ''}"
            class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)]" />
          <div class="flex gap-2">
            <button onclick="MainApp.saveGeminiApiKey()" class="flex-1 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl">
              Guardar Clave
            </button>
            <button onclick="MainApp.testGeminiApiKey()" class="px-4 py-2 bg-[var(--background)] border border-[var(--card-border)] text-xs font-bold rounded-xl hover:border-[var(--primary)]">
              Probar conexión
            </button>
          </div>
          <div id="gemini-test-status" class="text-xs hidden"></div>
        </div>
      </div>
    `;
  }

  saveGeminiApiKey() {
    const input = document.getElementById('gemini-key-input');
    if (!input) return;
    const settings = window.AppStore.getSettings();
    settings.geminiApiKey = input.value.trim();
    window.AppStore.saveSettings(settings);
    alert("¡Clave de IA guardada correctamente en el almacenamiento local!");
  }

  async testGeminiApiKey() {
    const input = document.getElementById('gemini-key-input');
    const statusEl = document.getElementById('gemini-test-status');
    if (!input || !statusEl) return;

    const key = input.value.trim();
    statusEl.className = 'text-xs p-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted-foreground)]';
    statusEl.textContent = 'Probando conexión con Gemini Flash...';

    const res = await window.AICoach.testConnection(key);
    if (res.ok) {
      const settings = window.AppStore.getSettings();
      settings.geminiApiKey = key;
      window.AppStore.saveSettings(settings);
      statusEl.className = 'text-xs p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold';
      statusEl.textContent = '✓ ' + res.message + ' (Clave guardada automáticamente).';
    } else {
      statusEl.className = 'text-xs p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300';
      statusEl.textContent = '✕ Error: ' + res.message;
    }
  }

  exportDataBackup() {
    const jsonStr = window.AppStore.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mi_evolucion_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  triggerImportBackup() {
    const input = document.getElementById('backup-file-input');
    if (input) input.click();
  }

  handleBackupFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const res = window.AppStore.importBackup(content);
      if (res.success) {
        alert("¡Copia de seguridad restaurada con éxito!");
        this.renderCurrentTab();
      } else {
        alert("Error al importar la copia: " + res.error);
      }
    };
    reader.readAsText(file);
  }

  // Modales de Acción
  openAddMealModal() {
    const modal = document.getElementById('global-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-[var(--foreground)] max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-lg">Registrar Comida</h3>
            <button onclick="document.getElementById('global-modal').innerHTML=''" class="text-[var(--muted-foreground)] text-lg">✕</button>
          </div>

          <!-- 4 Opciones según especificación -->
          <div class="grid grid-cols-2 gap-3 text-xs">
            <label class="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[var(--primary)] transition">
              <span class="text-2xl">📸</span>
              <span class="font-bold text-center">Hacer Foto (Cámara)</span>
              <input type="file" accept="image/*" capture="environment" class="hidden" onchange="MainApp.handleMealPhotoUpload(event)" />
            </label>

            <label class="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[var(--primary)] transition">
              <span class="text-2xl">🖼️</span>
              <span class="font-bold text-center">Foto de Galería</span>
              <input type="file" accept="image/*" class="hidden" onchange="MainApp.handleMealPhotoUpload(event)" />
            </label>
          </div>

          <!-- O añadir manualmente -->
          <div class="border-t border-[var(--card-border)] pt-4 space-y-3">
            <h4 class="font-bold text-xs uppercase tracking-wider text-[var(--muted-foreground)]">O Introducir Manualmente</h4>
            <input type="text" id="manual-meal-name" placeholder="Ej: Pechuga de pollo con patata cocida" class="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs" />
            <div class="grid grid-cols-2 gap-2">
              <input type="number" id="manual-meal-cal" placeholder="Calorías (kcal)" class="px-3.5 py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs" />
              <input type="number" id="manual-meal-prot" placeholder="Proteína (g)" class="px-3.5 py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs" />
            </div>
            <select id="manual-meal-type" class="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs">
              <option value="desayuno">Desayuno</option>
              <option value="comida" selected>Comida</option>
              <option value="merienda">Merienda</option>
              <option value="cena">Cena</option>
            </select>
            <button onclick="MainApp.saveManualMeal()" class="w-full py-3 bg-[var(--primary)] text-white font-bold text-xs rounded-xl shadow">
              Guardar Comida Manual
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async handleMealPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const modal = document.getElementById('global-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl w-full max-w-md p-6 space-y-4 text-center">
          <div class="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h4 class="font-bold text-sm">Analizando Plato con IA Multimodal...</h4>
          <p class="text-xs text-[var(--muted-foreground)]">Identificando ingredientes, raciones y verificando alérgenos (sin gluten y lactosa).</p>
        </div>
      </div>
    `;

    const result = await window.NutritionEngine.analyzeMealPhoto(file);
    const isRealAI = result.source === 'gemini';

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-[var(--foreground)] max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold ${isRealAI ? 'text-emerald-400' : 'text-amber-400'} uppercase tracking-wider">
              ${isRealAI ? '✨ Análisis Gemini IA Finalizado' : '⚠️ Análisis Simulado (Sin IA real)'}
            </span>
            <button onclick="document.getElementById('global-modal').innerHTML=''" class="text-[var(--muted-foreground)] text-lg">✕</button>
          </div>

          ${!isRealAI ? `
            <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-200 space-y-1.5">
              <div class="font-bold">No se pudo usar Gemini Vision</div>
              <p class="text-[11px] opacity-90">${result.fallbackReason || 'Configura tu clave API en Perfil para analizar fotos reales.'}</p>
              <button onclick="document.getElementById('global-modal').innerHTML=''; MainApp.switchTab('perfil');" class="text-[11px] font-bold underline text-amber-300">
                Ir a Perfil para configurar la clave →
              </button>
            </div>
          ` : ''}

          ${result.photoPreview ? `
            <img src="${result.photoPreview}" alt="Plato analizado" class="w-full h-40 object-cover rounded-2xl border border-[var(--card-border)]" />
          ` : ''}

          <h3 class="font-black text-lg">${result.dishName}</h3>
          
          <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1 text-amber-200">
            <div class="font-bold">⚠️ Protocolo Celiaquía</div>
            <p class="text-[11px]">${result.celiacAlert || 'Verificar ingredientes y posible contaminación cruzada.'}</p>
          </div>

          <!-- Ficha de desglose con cantidades editables -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Ingredientes Identificados</h4>
            ${(result.items || []).map(it => `
              <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold block">${it.name}</span>
                  <span class="text-[10px] text-[var(--muted-foreground)]">${it.estimatedPortion || ''}</span>
                </div>
                <div class="text-right">
                  <span class="font-mono font-bold text-amber-400">${it.calories} kcal</span>
                  <span class="text-[10px] text-emerald-400 font-mono block">${it.protein}g prot</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Total provisional -->
          <div class="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex justify-between items-center text-xs">
            <span class="font-bold">Estimación Total:</span>
            <div class="font-mono text-sm">
              <span class="text-amber-400 font-bold">${result.totalCalories} kcal</span> • <span class="text-emerald-400 font-bold">${result.totalProtein}g prot</span>
            </div>
          </div>

          <!-- Campo para aclaraciones rápidas -->
          <div>
            <label class="text-xs text-[var(--muted-foreground)] block mb-1">Aclaración rápida (ej: "es pan sin gluten", "dejé la mitad"):</label>
            <input type="text" id="ai-photo-comment" placeholder="Añade detalles si procede..." class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs" />
          </div>

          <button onclick="MainApp.confirmAnalyzedMeal()" 
            class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition">
            ✓ CONFIRMAR COMIDA REALMENTE CONSUMIDA
          </button>
        </div>
      </div>
    `;
  }

  confirmAnalyzedMeal() {
    const mealData = window.NutritionEngine.currentPendingMeal;
    if (!mealData) return;
    const commentInput = document.getElementById('ai-photo-comment');
    if (commentInput && commentInput.value.trim()) {
      mealData.notes = commentInput.value.trim();
    }
    window.NutritionEngine.confirmMeal(mealData);
    window.NutritionEngine.currentPendingMeal = null;
    document.getElementById('global-modal').innerHTML = '';
    alert("¡Comida registrada y macros actualizados!");
    this.renderCurrentTab();
  }

  saveManualMeal() {
    const name = document.getElementById('manual-meal-name')?.value.trim();
    const cal = parseInt(document.getElementById('manual-meal-cal')?.value) || 0;
    const prot = parseInt(document.getElementById('manual-meal-prot')?.value) || 0;
    const type = document.getElementById('manual-meal-type')?.value || 'comida';

    if (!name) {
      alert("Por favor indica el nombre del plato.");
      return;
    }

    window.NutritionEngine.confirmMeal({
      dishName: name,
      mealType: type,
      totalCalories: cal,
      totalProtein: prot,
      totalCarbs: Math.round(cal * 0.45 / 4),
      totalFat: Math.round(cal * 0.25 / 9)
    });

    document.getElementById('global-modal').innerHTML = '';
    alert("¡Comida guardada!");
    this.renderCurrentTab();
  }

  openAddEvolutionModal() {
    const modal = document.getElementById('global-modal');
    if (!modal) return;

    const today = new Date().toISOString().split('T')[0];
    const profile = window.AppStore.getProfile();
    const logs = [...window.AppStore.getEvolutionLog()].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const last = logs[0] || {};

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-[var(--foreground)] max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-lg">Registrar Medición</h3>
            <button onclick="document.getElementById('global-modal').innerHTML=''" class="text-[var(--muted-foreground)] text-lg">✕</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="text-[var(--muted-foreground)] block mb-1">Fecha</label>
              <input type="date" id="evo-date" value="${today}" class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="text-[var(--muted-foreground)] block mb-1">Peso (kg)</label>
                <input type="number" step="0.1" id="evo-weight" placeholder="${last.weight ?? profile.weight ?? '74.0'}" class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
              </div>
              <div>
                <label class="text-[var(--muted-foreground)] block mb-1">Cintura (cm)</label>
                <input type="number" step="0.1" id="evo-waist" placeholder="${last.waist ?? '84.5'}" class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="text-[var(--muted-foreground)] block mb-1">Pecho (cm)</label>
                <input type="number" step="0.1" id="evo-chest" placeholder="Opcional" class="w-full px-2.5 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
              </div>
              <div>
                <label class="text-[var(--muted-foreground)] block mb-1">Brazo (cm)</label>
                <input type="number" step="0.1" id="evo-arm" placeholder="Opcional" class="w-full px-2.5 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
              </div>
              <div>
                <label class="text-[var(--muted-foreground)] block mb-1">Muslo (cm)</label>
                <input type="number" step="0.1" id="evo-thigh" placeholder="Opcional" class="w-full px-2.5 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="text-[var(--muted-foreground)] block mb-1">Molestia lumbar (0-10)</label>
                <input type="number" min="0" max="10" id="evo-pain-lumbar" placeholder="0 = sin dolor" class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
              </div>
              <div>
                <label class="text-[var(--muted-foreground)] block mb-1">Molestia hombro (0-10)</label>
                <input type="number" min="0" max="10" id="evo-pain-shoulder" placeholder="0 = sin dolor" class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
              </div>
            </div>

            <div>
              <label class="text-[var(--muted-foreground)] block mb-1">Notas (opcional)</label>
              <input type="text" id="evo-notes" placeholder="Ej: Medición en ayunas..." class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
            </div>

            <button onclick="MainApp.saveEvolutionEntry()" class="w-full py-3 bg-[var(--primary)] text-white font-bold text-xs rounded-xl shadow active:scale-95 transition">
              Guardar Medición
            </button>
          </div>
        </div>
      </div>
    `;
  }

  saveEvolutionEntry() {
    const parseOpt = (id) => {
      const val = document.getElementById(id)?.value.trim();
      if (!val) return null;
      const num = parseFloat(val);
      return Number.isFinite(num) ? num : null;
    };

    const date = document.getElementById('evo-date')?.value || new Date().toISOString().split('T')[0];
    const weight = parseOpt('evo-weight');
    const waist = parseOpt('evo-waist');
    const chest = parseOpt('evo-chest');
    const armRight = parseOpt('evo-arm');
    const thighRight = parseOpt('evo-thigh');
    const painLumbarScore = parseOpt('evo-pain-lumbar');
    const painShoulderScore = parseOpt('evo-pain-shoulder');
    const notes = document.getElementById('evo-notes')?.value.trim() || '';

    if (weight === null && waist === null && chest === null && armRight === null && thighRight === null) {
      alert('Introduce al menos una medida (peso, cintura, pecho, brazo o muslo).');
      return;
    }

    const entry = {
      id: 'evo_' + Date.now(),
      date,
      weight,
      waist,
      chest,
      armRight,
      thighRight,
      painLumbarScore,
      painShoulderScore,
      notes
    };

    window.AppStore.addEvolutionEntry(entry);

    if (weight !== null) {
      const profile = window.AppStore.getProfile();
      profile.weight = weight;
      window.AppStore.saveProfile(profile);
    }

    document.getElementById('global-modal').innerHTML = '';
    this.renderCurrentTab();
  }

  deleteEvolutionEntry(id) {
    if (!confirm('¿Eliminar esta medición del historial?')) return;
    window.AppStore.deleteEvolutionEntry(id);
    this.renderCurrentTab();
  }

  // --- GENERAR NUEVA RUTINA CON IA Y EDITAR RUTINAS ---
  showCreateRoutineModal() {
    const modal = document.getElementById('global-modal');
    if (!modal) return;
    this.pendingGeneratedRoutine = null;

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-[var(--foreground)] max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Generador Inteligente</span>
              <h3 class="font-bold text-lg">Nueva Rutina con IA ✨</h3>
            </div>
            <button onclick="document.getElementById('global-modal').innerHTML=''" class="text-[var(--muted-foreground)] text-lg">✕</button>
          </div>

          <p class="text-xs text-[var(--muted-foreground)]">
            Describe qué quieres entrenar y la IA diseñará la rutina respetando automáticamente tu historial lumbar (L2-S1), hombro derecho (SLAP) y codos.
          </p>

          <!-- Sugerencias rápidas -->
          <div class="flex flex-wrap gap-1.5 text-[11px]">
            <button type="button" onclick="document.getElementById('ai-routine-prompt').value='Full Body equilibrado en máquinas, seguro para lumbar y hombro'" class="px-2.5 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg hover:border-[var(--primary)]">
              🏋️ Full Body seguro
            </button>
            <button type="button" onclick="document.getElementById('ai-routine-prompt').value='Tren superior enfoque pecho, espalda y brazos sin sobrecargar hombro'" class="px-2.5 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg hover:border-[var(--primary)]">
              💪 Tren superior
            </button>
            <button type="button" onclick="document.getElementById('ai-routine-prompt').value='Pierna y glúteo sin carga axial en columna para transferencia al pádel'" class="px-2.5 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg hover:border-[var(--primary)]">
              🦵 Pierna y pádel
            </button>
            <button type="button" onclick="document.getElementById('ai-routine-prompt').value='Rutina corta de movilidad, core profundo y alivio lumbar en casa'; document.getElementById('ai-routine-category').value='Doméstica'; document.getElementById('ai-routine-duration').value='12';" class="px-2.5 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg hover:border-[var(--primary)]">
              🧘 Core en casa
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="text-[var(--muted-foreground)] block mb-1">¿Qué rutina quieres que genere?</label>
              <textarea id="ai-routine-prompt" rows="3" placeholder="Ej: Quiero una rutina de 45 min para fortalecer piernas, espalda y hombros sin dolor lumbar..."
                class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl resize-none"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="text-[var(--muted-foreground)] block mb-1">Tipo</label>
                <select id="ai-routine-category" class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl">
                  <option value="Gimnasio" selected>Gimnasio</option>
                  <option value="Doméstica">Doméstica (Casa)</option>
                </select>
              </div>
              <div>
                <label class="text-[var(--muted-foreground)] block mb-1">Duración (min)</label>
                <input type="number" id="ai-routine-duration" value="45" min="5" max="90" class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
              </div>
            </div>

            <div id="ai-routine-error" class="hidden p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs"></div>

            <button id="ai-routine-btn" onclick="MainApp.generateRoutineFromModal()" class="w-full py-3 bg-[var(--primary)] text-white font-bold text-xs rounded-xl shadow active:scale-95 transition">
              ✨ Generar Rutina con Gemini IA
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async generateRoutineFromModal() {
    const prompt = document.getElementById('ai-routine-prompt')?.value.trim();
    const category = document.getElementById('ai-routine-category')?.value || 'Gimnasio';
    const durationMinutes = parseInt(document.getElementById('ai-routine-duration')?.value, 10) || 45;
    const errorEl = document.getElementById('ai-routine-error');
    const btn = document.getElementById('ai-routine-btn');

    if (!prompt) {
      if (errorEl) {
        errorEl.classList.remove('hidden');
        errorEl.textContent = 'Escribe brevemente qué quieres entrenar o elige una sugerencia rápida arriba.';
      }
      return;
    }

    if (errorEl) errorEl.classList.add('hidden');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Diseñando rutina segura con IA...';
    }

    try {
      const generated = await window.AICoach.generateRoutineWithAI({ prompt, category, durationMinutes });
      this.pendingGeneratedRoutine = generated;
      this.renderGeneratedRoutinePreview(generated);
    } catch (err) {
      if (errorEl) {
        errorEl.classList.remove('hidden');
        errorEl.textContent = 'Error: ' + (err.message || 'No se pudo generar la rutina.');
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = '✨ Generar Rutina con Gemini IA';
      }
    }
  }

  renderGeneratedRoutinePreview(routine) {
    const modal = document.getElementById('global-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-[var(--foreground)] max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">✨ Rutina Generada (${routine.modelUsed || 'Gemini'})</span>
            <button onclick="document.getElementById('global-modal').innerHTML=''" class="text-[var(--muted-foreground)] text-lg">✕</button>
          </div>

          <div class="space-y-1">
            <h3 class="font-black text-base">${routine.name}</h3>
            <p class="text-xs text-[var(--muted-foreground)]">${routine.notes || ''}</p>
            <div class="flex gap-2 text-[10px] pt-1">
              <span class="px-2 py-0.5 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] font-bold">${routine.category}</span>
              <span class="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold">~${routine.estimatedMinutes} min</span>
            </div>
          </div>

          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Ejercicios (${routine.exercises.length})</h4>
            ${routine.exercises.map((ex, idx) => `
              <div class="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] text-xs space-y-1">
                <div class="flex items-start justify-between gap-2">
                  <span class="font-bold">${idx + 1}. ${ex.name}</span>
                  <span class="font-mono text-[11px] text-emerald-400 whitespace-nowrap">${ex.targetSets} × ${ex.targetReps} ${ex.targetWeight ? `@ ${ex.targetWeight}kg` : ''}</span>
                </div>
                <div class="flex flex-wrap gap-1.5 text-[10px]">
                  ${ex.muscleGroup ? `<span class="text-[var(--muted-foreground)]">${ex.muscleGroup}</span>` : ''}
                  ${ex.safetyTag ? `<span class="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 font-semibold">${ex.safetyTag}</span>` : ''}
                </div>
                ${ex.notes ? `<p class="text-[11px] text-[var(--muted-foreground)] leading-snug">${ex.notes}</p>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="flex gap-2 pt-1">
            <button onclick="MainApp.showCreateRoutineModal()" class="px-4 py-3 bg-[var(--background)] border border-[var(--card-border)] text-xs font-bold rounded-xl">
              Regenerar
            </button>
            <button onclick="MainApp.saveGeneratedRoutine()" class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition">
              ✓ Guardar Rutina
            </button>
          </div>
        </div>
      </div>
    `;
  }

  saveGeneratedRoutine() {
    const gen = this.pendingGeneratedRoutine;
    if (!gen) return;

    const mappedExercises = gen.exercises.map((ex, idx) => {
      let exId = ex.exerciseId;
      const exists = exId ? window.AppStore.getExerciseById(exId) : null;
      if (!exists) {
        exId = 'ex_ai_' + Date.now() + '_' + idx;
        window.AppStore.saveExercise({
          id: exId,
          name: ex.name || `Ejercicio ${idx + 1}`,
          muscleGroup: ex.muscleGroup || 'General',
          secondaryMuscles: [],
          equipment: ex.equipment || 'Gimnasio',
          recommendedSets: String(ex.targetSets || 3),
          recommendedReps: String(ex.targetReps || '10-12'),
          recommendedRestSeconds: Number(ex.restSeconds) || 75,
          notes: ex.notes || '',
          safetyTag: ex.safetyTag || 'Adaptado IA',
          axialLoad: ex.axialLoad || 'Baja'
        });
      }
      return {
        exerciseId: exId,
        targetSets: Number(ex.targetSets) || 3,
        targetReps: String(ex.targetReps || '10-12'),
        targetWeight: Number(ex.targetWeight) || 0,
        restSeconds: Number(ex.restSeconds) || 75
      };
    });

    const newRoutine = {
      id: 'rutina_ai_' + Date.now(),
      name: gen.name || 'Rutina personalizada IA',
      type: gen.type || (gen.category === 'Doméstica' ? 'readaptacion' : 'hipertrofia'),
      category: gen.category === 'Doméstica' ? 'Doméstica' : 'Gimnasio',
      statusBadge: 'Generada con IA',
      estimatedMinutes: Number(gen.estimatedMinutes) || 45,
      notes: gen.notes || '',
      exercises: mappedExercises
    };

    window.AppStore.saveRoutine(newRoutine);
    this.pendingGeneratedRoutine = null;
    document.getElementById('global-modal').innerHTML = '';
    this.renderCurrentTab();
  }

  editRoutine(routineId) {
    const routine = window.AppStore.getRoutineById(routineId);
    const modal = document.getElementById('global-modal');
    if (!routine || !modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-[var(--foreground)] max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-lg">Editar Rutina</h3>
            <button onclick="document.getElementById('global-modal').innerHTML=''" class="text-[var(--muted-foreground)] text-lg">✕</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="text-[var(--muted-foreground)] block mb-1">Nombre</label>
              <input type="text" id="edit-routine-name" value="${routine.name.replace(/"/g, '&quot;')}" class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl" />
            </div>

            <div>
              <label class="text-[var(--muted-foreground)] block mb-1">Notas</label>
              <textarea id="edit-routine-notes" rows="2" class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl resize-none">${routine.notes || ''}</textarea>
            </div>

            <div class="space-y-2">
              <label class="text-[var(--muted-foreground)] block font-bold uppercase text-[10px]">Ejercicios (Series / Reps / Peso kg)</label>
              ${routine.exercises.map((ex, i) => {
                const exData = window.AppStore.getExerciseById(ex.exerciseId) || { name: 'Ejercicio' };
                return `
                  <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)] space-y-1.5">
                    <div class="font-bold truncate">${i + 1}. ${exData.name}</div>
                    <div class="grid grid-cols-3 gap-2">
                      <input type="number" id="edit-ex-sets-${i}" value="${ex.targetSets}" min="1" class="px-2 py-1.5 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-center" title="Series" />
                      <input type="text" id="edit-ex-reps-${i}" value="${ex.targetReps}" class="px-2 py-1.5 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-center" title="Repeticiones" />
                      <input type="number" step="0.5" id="edit-ex-weight-${i}" value="${ex.targetWeight}" class="px-2 py-1.5 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-center" title="Peso (kg)" />
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="flex gap-2 pt-2">
              <button onclick="MainApp.deleteRoutineById('${routine.id}')" class="px-4 py-3 bg-red-500/15 border border-red-500/30 text-red-300 font-bold text-xs rounded-xl">
                Eliminar
              </button>
              <button onclick="MainApp.saveEditedRoutine('${routine.id}')" class="flex-1 py-3 bg-[var(--primary)] text-white font-bold text-xs rounded-xl shadow">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  saveEditedRoutine(routineId) {
    const routine = window.AppStore.getRoutineById(routineId);
    if (!routine) return;

    routine.name = document.getElementById('edit-routine-name')?.value.trim() || routine.name;
    routine.notes = document.getElementById('edit-routine-notes')?.value.trim() || '';
    routine.exercises = routine.exercises.map((ex, i) => ({
      ...ex,
      targetSets: parseInt(document.getElementById(`edit-ex-sets-${i}`)?.value, 10) || ex.targetSets,
      targetReps: document.getElementById(`edit-ex-reps-${i}`)?.value.trim() || ex.targetReps,
      targetWeight: parseFloat(document.getElementById(`edit-ex-weight-${i}`)?.value) || 0
    }));

    window.AppStore.saveRoutine(routine);
    document.getElementById('global-modal').innerHTML = '';
    this.renderCurrentTab();
  }

  deleteRoutineById(routineId) {
    if (!confirm('¿Seguro que quieres eliminar esta rutina?')) return;
    window.AppStore.deleteRoutine(routineId);
    document.getElementById('global-modal').innerHTML = '';
    this.renderCurrentTab();
  }
}

window.MainApp = new Application();
document.addEventListener('DOMContentLoaded', () => {
  window.MainApp.init();
});
