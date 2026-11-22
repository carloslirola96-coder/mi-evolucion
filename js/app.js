/**
 * MI EVOLUCIÓN - Coordinador Principal de la Aplicación y Enrutamiento de Vistas
 */

class Application {
  constructor() {
    this.currentTab = 'inicio';
  }

  init() {
    this.setupTheme();
    this.bindEvents();
    this.switchTab('inicio');
    WorkoutEngine.init();
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
    const logs = window.AppStore.getEvolutionLog();
    const sessions = window.AppStore.getSessions();
    const weeklyVol = window.ClinicalRules.calculateWeeklyVolume(sessions);

    container.innerHTML = `
      <div class="space-y-5 pb-24">
        <div class="flex items-center justify-between pt-1">
          <div>
            <span class="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Módulo de Evolución</span>
            <h1 class="text-2xl font-black">Progreso y Métricas</h1>
          </div>
          <button onclick="MainApp.openAddEvolutionModal()" class="px-3.5 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl shadow flex items-center gap-1">
            <span>+</span> Registrar Medida
          </button>
        </div>

        <!-- Resumen de Composición Corporal -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
            <span class="text-xs text-[var(--muted-foreground)]">Peso Corporal</span>
            <div class="text-3xl font-black font-mono text-[var(--foreground)] mt-0.5">${profile.weight} kg</div>
            <span class="text-[10px] text-emerald-400 font-semibold">Objetivo: Masa magra</span>
          </div>

          <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
            <span class="text-xs text-[var(--muted-foreground)]">Perímetro Cintura</span>
            <div class="text-3xl font-black font-mono text-amber-400 mt-0.5">84.5 cm</div>
            <span class="text-[10px] text-[var(--muted-foreground)]">Medición matutina</span>
          </div>
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
  renderEntrenador(container) {
    container.innerHTML = `
      <div class="space-y-4 pb-28 flex flex-col h-[calc(100vh-120px)]">
        <div class="pt-1">
          <span class="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Entrenador y Readaptador IA</span>
          <h1 class="text-2xl font-black">Asistente Personal</h1>
        </div>

        <!-- Sugerencias de preguntas rápidas con un toque -->
        <div class="flex overflow-x-auto gap-2 py-1 no-scrollbar flex-shrink-0">
          <button onclick="MainApp.sendQuickCoachQuery('¿Qué entreno hoy?')" class="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-xs font-medium hover:border-[var(--primary)]">
            🎯 ¿Qué entreno hoy?
          </button>
          <button onclick="MainApp.sendQuickCoachQuery('¿Qué puedo cenar alto en proteína sin cocinar?')" class="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-xs font-medium hover:border-[var(--primary)]">
            🥗 Cena rápida sin cocinar
          </button>
          <button onclick="MainApp.sendQuickCoachQuery('Me ha molestado la espalda después del entrenamiento')" class="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-xs font-medium hover:border-[var(--primary)]">
            🛡 Molestia lumbar
          </button>
          <button onclick="MainApp.sendQuickCoachQuery('¿Cuándo podré volver a competir al pádel?')" class="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-xs font-medium hover:border-[var(--primary)]">
            🎾 Vuelta al pádel
          </button>
        </div>

        <!-- Historial de conversación interactivo -->
        <div id="ai-chat-messages" class="flex-1 overflow-y-auto space-y-3 p-3 bg-[var(--card)] rounded-2xl border border-[var(--card-border)] text-xs">
          <!-- Mensaje de bienvenida inicial -->
          <div class="flex gap-2.5 items-start">
            <span class="w-7 h-7 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">IA</span>
            <div class="bg-[var(--background)] p-3 rounded-2xl rounded-tl-none border border-[var(--card-border)] space-y-1.5 max-w-[85%]">
              <p class="font-semibold text-sm">Hola Carlo,</p>
              <p class="leading-relaxed text-[var(--foreground)]">
                Tengo cargada en memoria tu ficha clínica: protrusiones discales L2-S1, lesión SLAP hombro derecho, celiaquía estricta y tu objetivo de recomposición corporal con 3 sesiones de gimnasio.
              </p>
              <p class="leading-relaxed text-[var(--muted-foreground)]">
                ¿En qué puedo ayudarte hoy respecto a tus ejercicios, cargas o nutrición?
              </p>
            </div>
          </div>
        </div>

        <!-- Input fijo inferior para escribir -->
        <div class="flex gap-2 pt-2 flex-shrink-0">
          <input type="text" id="ai-chat-input" placeholder="Pregunta sobre cargas, lesiones o comidas..." 
            onkeydown="if(event.key==='Enter') MainApp.sendCustomCoachMessage()"
            class="flex-1 px-4 py-3 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] shadow-sm" />
          <button onclick="MainApp.sendCustomCoachMessage()" class="px-5 py-3 bg-[var(--primary)] text-white font-bold text-xs rounded-2xl shadow active:scale-95 transition">
            Enviar
          </button>
        </div>
      </div>
    `;
  }

  async sendQuickCoachQuery(query) {
    const input = document.getElementById('ai-chat-input');
    if (input) input.value = query;
    await this.sendCustomCoachMessage();
  }

  async sendCustomCoachMessage() {
    const input = document.getElementById('ai-chat-input');
    const container = document.getElementById('ai-chat-messages');
    if (!input || !container) return;

    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Añadir mensaje del usuario
    container.innerHTML += `
      <div class="flex gap-2.5 justify-end">
        <div class="bg-[var(--primary)] text-white p-3 rounded-2xl rounded-tr-none text-xs max-w-[85%] font-medium">
          ${text}
        </div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;

    // Indicador de escribiendo
    const typingId = 'typing_' + Date.now();
    container.innerHTML += `
      <div id="${typingId}" class="flex gap-2.5 items-start">
        <span class="w-7 h-7 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">IA</span>
        <div class="bg-[var(--background)] p-3 rounded-2xl rounded-tl-none border border-[var(--card-border)] text-xs text-[var(--muted-foreground)] italic animate-pulse">
          Consultando base de datos médica y biomecánica...
        </div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;

    const response = await window.AICoach.askCoach(text);
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    container.innerHTML += `
      <div class="flex gap-2.5 items-start">
        <span class="w-7 h-7 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">IA</span>
        <div class="bg-[var(--background)] p-3 rounded-2xl rounded-tl-none border border-[var(--card-border)] space-y-1.5 max-w-[85%] text-xs leading-relaxed">
          ${response.replace(/\n/g, '<br/>')}
        </div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
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
          <h3 class="font-bold text-sm">IA Externa (Opcional - Coste Cero)</h3>
          <p class="text-xs text-[var(--muted-foreground)]">
            La app funciona 100% offline con el motor determinista. Si deseas conectar Gemini 1.5 Flash gratuitamente desde Google AI Studio, puedes pegar tu clave personal aquí:
          </p>
          <input type="password" id="gemini-key-input" placeholder="Pega tu clave gratuita de Google AI Studio..." value="${settings.geminiApiKey || ''}"
            class="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)]" />
          <button onclick="MainApp.saveGeminiApiKey()" class="w-full py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl">
            Guardar Clave de IA
          </button>
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

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-[var(--foreground)] max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Análisis IA Finalizado</span>
            <button onclick="document.getElementById('global-modal').innerHTML=''" class="text-[var(--muted-foreground)] text-lg">✕</button>
          </div>

          <h3 class="font-black text-lg">${result.dishName}</h3>
          
          <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1 text-amber-200">
            <div class="font-bold">⚠️ Protocolo Celiaquía</div>
            <p class="text-[11px]">${result.celiacAlert}</p>
          </div>

          <!-- Ficha de desglose con cantidades editables -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Ingredientes Identificados</h4>
            ${result.items.map(it => `
              <div class="p-2.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold block">${it.name}</span>
                  <span class="text-[10px] text-[var(--muted-foreground)]">${it.estimatedPortion}</span>
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

          <button onclick="MainApp.confirmAnalyzedMeal(${JSON.stringify(result).replace(/"/g, '&quot;')})" 
            class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition">
            ✓ CONFIRMAR COMIDA REALMENTE CONSUMIDA
          </button>
        </div>
      </div>
    `;
  }

  confirmAnalyzedMeal(mealData) {
    const commentInput = document.getElementById('ai-photo-comment');
    if (commentInput && commentInput.value.trim()) {
      mealData.notes = commentInput.value.trim();
    }
    window.NutritionEngine.confirmMeal(mealData);
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
}

window.MainApp = new Application();
document.addEventListener('DOMContentLoaded', () => {
  window.MainApp.init();
});
