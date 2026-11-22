/**
 * MI EVOLUCIÓN - Motor de Entrenamiento en Directo (Live Workout Engine)
 * Diseñado para control táctil con una mano, botones grandes, guardado automático y descanso inteligente.
 */

class WorkoutManager {
  constructor() {
    this.activeWorkout = null;
    this.sessionTimerInterval = null;
    this.restTimerInterval = null;
    this.restRemainingSeconds = 0;
    this.audioCtx = null;
    this.lastActionSetRef = null; // Para deshacer
  }

  init() {
    // Restaurar entrenamiento activo si existía previamente
    const saved = window.AppStore.getActiveWorkout();
    if (saved && saved.status === 'in_progress') {
      this.activeWorkout = saved;
      this.startSessionTimer();
      this.renderLiveWorkoutModal();
    }
  }

  // Sintetizador de sonido con Web Audio API (100% offline, cero dependencias)
  playBeep(frequency = 880, duration = 0.2, count = 1) {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
          gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start();
          osc.stop(this.audioCtx.currentTime + duration);
        }, i * 300);
      }
    } catch (e) {
      console.warn("Audio no disponible:", e);
    }
  }

  startWorkout(routineId) {
    const routine = window.AppStore.getRoutineById(routineId);
    if (!routine) return;

    // Obtener historial previo para mostrar pesos anteriores
    const pastSessions = window.AppStore.getSessions();

    const preparedExercises = routine.exercises.map(item => {
      const exData = window.AppStore.getExerciseById(item.exerciseId) || { name: "Ejercicio" };

      // Buscar último peso y reps de este ejercicio en sesiones anteriores
      let previousRecord = null;
      for (const sess of pastSessions) {
        const found = (sess.exercises || []).find(e => e.exerciseId === item.exerciseId);
        if (found && found.sets && found.sets.length > 0) {
          const validSet = found.sets.find(s => s.completed);
          if (validSet) {
            previousRecord = `${validSet.weight} kg × ${validSet.actualReps} reps`;
            break;
          }
        }
      }

      const sets = [];
      const numSets = parseInt(item.targetSets) || 3;
      for (let i = 1; i <= numSets; i++) {
        sets.push({
          setNumber: i,
          weight: item.targetWeight || 0,
          targetReps: item.targetReps || "8-12",
          actualReps: typeof item.targetReps === 'string' && item.targetReps.includes('-') 
                        ? parseInt(item.targetReps.split('-')[1]) 
                        : (parseInt(item.targetReps) || 10),
          completed: false,
          rir: 2,
          difficulty: "adecuada",
          painLocation: "ninguna",
          painLevel: 0,
          previousInfo: previousRecord || "Primera sesión",
          completedAt: null
        });
      }

      return {
        exerciseId: item.exerciseId,
        name: exData.name,
        muscleGroup: exData.muscleGroup,
        equipment: exData.equipment,
        notes: exData.notes || "",
        safetyTag: exData.safetyTag || "",
        restSeconds: item.restSeconds || 90,
        sets: sets
      };
    });

    this.activeWorkout = {
      id: "sess_" + Date.now(),
      routineId: routine.id,
      routineName: routine.name,
      category: routine.category,
      startTime: new Date().toISOString(),
      elapsedSeconds: 0,
      status: "in_progress",
      exercises: preparedExercises,
      currentExerciseIndex: 0
    };

    window.AppStore.saveActiveWorkout(this.activeWorkout);
    this.startSessionTimer();
    this.renderLiveWorkoutModal();
  }

  startSessionTimer() {
    if (this.sessionTimerInterval) clearInterval(this.sessionTimerInterval);
    this.sessionTimerInterval = setInterval(() => {
      if (!this.activeWorkout) return;
      this.activeWorkout.elapsedSeconds = Math.floor((Date.now() - new Date(this.activeWorkout.startTime).getTime()) / 1000);
      window.AppStore.saveActiveWorkout(this.activeWorkout);
      this.updateTimerDisplays();
    }, 1000);
  }

  updateTimerDisplays() {
    const el = document.getElementById("workout-session-timer");
    if (el && this.activeWorkout) {
      const mins = Math.floor(this.activeWorkout.elapsedSeconds / 60);
      const secs = this.activeWorkout.elapsedSeconds % 60;
      el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Marcado de serie con 1 solo toque
  toggleSetCompleted(exIdx, setIdx) {
    if (!this.activeWorkout) return;
    const exercise = this.activeWorkout.exercises[exIdx];
    const set = exercise.sets[setIdx];

    const wasCompleted = set.completed;
    set.completed = !wasCompleted;
    set.completedAt = set.completed ? new Date().toISOString() : null;

    this.lastActionSetRef = { exIdx, setIdx, wasCompleted };

    // Si se acaba de completar, lanzar descanso y opcionalmente pregunta rápida
    if (set.completed) {
      window.AppStore.saveActiveWorkout(this.activeWorkout);
      this.startRestTimer(exercise.restSeconds || 90);
      this.checkQuickPrompt(exIdx, setIdx);
    } else {
      window.AppStore.saveActiveWorkout(this.activeWorkout);
    }

    this.renderLiveWorkoutModal();
  }

  undoLastAction() {
    if (!this.lastActionSetRef || !this.activeWorkout) return;
    const { exIdx, setIdx, wasCompleted } = this.lastActionSetRef;
    if (this.activeWorkout.exercises[exIdx] && this.activeWorkout.exercises[exIdx].sets[setIdx]) {
      this.activeWorkout.exercises[exIdx].sets[setIdx].completed = wasCompleted;
      this.lastActionSetRef = null;
      this.stopRestTimer();
      window.AppStore.saveActiveWorkout(this.activeWorkout);
      this.renderLiveWorkoutModal();
    }
  }

  // Modificación rápida de peso y repeticiones
  updateSetValues(exIdx, setIdx, field, delta) {
    if (!this.activeWorkout) return;
    const set = this.activeWorkout.exercises[exIdx].sets[setIdx];
    if (field === 'weight') {
      set.weight = Math.max(0, Math.round((set.weight + delta) * 2) / 2);
    } else if (field === 'reps') {
      set.actualReps = Math.max(1, set.actualReps + delta);
    }
    window.AppStore.saveActiveWorkout(this.activeWorkout);
    this.renderLiveWorkoutModal();
  }

  // Temporizador de descanso
  startRestTimer(seconds) {
    if (this.restTimerInterval) clearInterval(this.restTimerInterval);
    this.restRemainingSeconds = seconds;
    const totalSeconds = seconds;

    const banner = document.getElementById("rest-timer-banner");
    if (banner) banner.classList.remove("hidden");

    this.updateRestDisplay(totalSeconds);

    this.restTimerInterval = setInterval(() => {
      this.restRemainingSeconds--;
      if (this.restRemainingSeconds <= 0) {
        clearInterval(this.restTimerInterval);
        this.restTimerInterval = null;
        this.playBeep(987, 0.4, 2); // Doble pitido al terminar descanso
        if (banner) banner.classList.add("hidden");
      } else {
        this.updateRestDisplay(totalSeconds);
      }
    }, 1000);
  }

  stopRestTimer() {
    if (this.restTimerInterval) {
      clearInterval(this.restTimerInterval);
      this.restTimerInterval = null;
    }
    const banner = document.getElementById("rest-timer-banner");
    if (banner) banner.classList.add("hidden");
  }

  adjustRestTimer(secondsDelta) {
    this.restRemainingSeconds = Math.max(5, this.restRemainingSeconds + secondsDelta);
    this.updateRestDisplay(this.restRemainingSeconds);
  }

  updateRestDisplay(totalSeconds) {
    const textEl = document.getElementById("rest-timer-countdown");
    const progressEl = document.getElementById("rest-timer-progress");
    if (textEl) {
      const m = Math.floor(this.restRemainingSeconds / 60);
      const s = this.restRemainingSeconds % 60;
      textEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }
    if (progressEl) {
      const pct = Math.max(0, Math.min(100, (this.restRemainingSeconds / totalSeconds) * 100));
      progressEl.style.width = `${pct}%`;
    }
  }

  // Pregunta rápida contextual no intrusiva
  checkQuickPrompt(exIdx, setIdx) {
    const settings = window.AppStore.getSettings();
    if (settings.askQuickQuestionsFrequency === 'low') return;

    // Solo preguntar en la última serie o de forma aleatoria inteligente
    const ex = this.activeWorkout.exercises[exIdx];
    const isLastSet = setIdx === ex.sets.length - 1;

    if (isLastSet || Math.random() < 0.4) {
      setTimeout(() => {
        this.showQuickPromptModal(exIdx, setIdx);
      }, 500);
    }
  }

  showQuickPromptModal(exIdx, setIdx) {
    const ex = this.activeWorkout.exercises[exIdx];
    const set = ex.sets[setIdx];

    const modal = document.getElementById("quick-prompt-modal");
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-[var(--foreground)]">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">Control de Sensaciones</span>
            <button onclick="document.getElementById('quick-prompt-modal').innerHTML=''" class="text-[var(--muted-foreground)] text-sm">Omitir</button>
          </div>
          <h4 class="font-bold text-base">${ex.name} (Serie ${setIdx + 1})</h4>
          
          <div>
            <label class="text-xs text-[var(--muted-foreground)] block mb-1.5">¿Cuántas reps más podrías haber hecho? (RIR)</label>
            <div class="grid grid-cols-4 gap-2">
              ${[0, 1, 2, 3].map(val => `
                <button onclick="WorkoutEngine.saveRIR(${exIdx}, ${setIdx}, ${val})" 
                  class="py-2.5 rounded-xl border text-sm font-semibold transition ${set.rir === val ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--background)] border-[var(--card-border)]'}">
                  ${val === 3 ? '3+' : val}
                </button>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="text-xs text-[var(--muted-foreground)] block mb-1.5">¿Has sentido alguna molestia?</label>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <button onclick="WorkoutEngine.savePain(${exIdx}, ${setIdx}, 'ninguna', 0)" class="p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] font-medium text-emerald-400">
                ✓ Sin molestia
              </button>
              <button onclick="WorkoutEngine.savePain(${exIdx}, ${setIdx}, 'lumbar', 3)" class="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 font-medium text-amber-300">
                ⚠ Zona Lumbar
              </button>
              <button onclick="WorkoutEngine.savePain(${exIdx}, ${setIdx}, 'hombro', 3)" class="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 font-medium text-amber-300">
                ⚠ Hombro derecho
              </button>
              <button onclick="WorkoutEngine.savePain(${exIdx}, ${setIdx}, 'codo', 2)" class="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 font-medium text-amber-300">
                ⚠ Codo / Tríceps
              </button>
            </div>
          </div>

          <button onclick="document.getElementById('quick-prompt-modal').innerHTML=''" class="w-full py-3 bg-[var(--primary)] text-white font-semibold rounded-xl text-sm">
            Guardar y seguir descansando
          </button>
        </div>
      </div>
    `;
  }

  saveRIR(exIdx, setIdx, rir) {
    if (this.activeWorkout) {
      this.activeWorkout.exercises[exIdx].sets[setIdx].rir = rir;
      window.AppStore.saveActiveWorkout(this.activeWorkout);
      this.showQuickPromptModal(exIdx, setIdx);
    }
  }

  savePain(exIdx, setIdx, location, level) {
    if (this.activeWorkout) {
      this.activeWorkout.exercises[exIdx].sets[setIdx].painLocation = location;
      this.activeWorkout.exercises[exIdx].sets[setIdx].painLevel = level;
      window.AppStore.saveActiveWorkout(this.activeWorkout);
      document.getElementById('quick-prompt-modal').innerHTML = '';
      this.renderLiveWorkoutModal();
    }
  }

  // Finalizar entrenamiento
  finishWorkout() {
    if (!this.activeWorkout) return;

    // Calcular métricas
    let totalSetsPlanned = 0;
    let totalSetsCompleted = 0;
    let totalVolumeKg = 0;
    let exercisesCompletedCount = 0;
    const muscleGroupsWorked = new Set();
    const progressionProposals = [];

    this.activeWorkout.exercises.forEach(ex => {
      let exHasDone = false;
      const completedSets = ex.sets.filter(s => s.completed);
      totalSetsPlanned += ex.sets.length;
      totalSetsCompleted += completedSets.length;

      completedSets.forEach(s => {
        totalVolumeKg += (s.weight || 0) * (s.actualReps || 0);
        exHasDone = true;
      });

      if (exHasDone) {
        exercisesCompletedCount++;
        muscleGroupsWorked.add(ex.muscleGroup);

        // Evaluar progresión inteligente
        const prog = ClinicalRules.evaluateProgression(ex.exerciseId, ex.sets.length, ex.sets[0].targetReps, completedSets);
        if (prog.action === "increase_weight" || prog.action === "reduce_or_deload") {
          progressionProposals.push({
            exerciseName: ex.name,
            exerciseId: ex.exerciseId,
            progression: prog
          });
        }
      }
    });

    this.stopRestTimer();
    if (this.sessionTimerInterval) clearInterval(this.sessionTimerInterval);

    const completedSession = {
      ...this.activeWorkout,
      endTime: new Date().toISOString(),
      durationMinutes: Math.round(this.activeWorkout.elapsedSeconds / 60),
      totalSetsPlanned,
      totalSetsCompleted,
      totalVolumeKg,
      exercisesCompletedCount,
      muscleGroupsWorked: Array.from(muscleGroupsWorked),
      progressionProposals,
      status: "completed"
    };

    window.AppStore.saveCompletedSession(completedSession);
    window.AppStore.clearActiveWorkout();
    this.activeWorkout = null;

    this.showFinishSummaryModal(completedSession);
  }

  showFinishSummaryModal(session) {
    const modal = document.getElementById("live-workout-container");
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 bg-[var(--background)] z-50 overflow-y-auto p-4 md:p-8 flex flex-col justify-between max-w-xl mx-auto text-[var(--foreground)]">
        <div class="space-y-6">
          <div class="text-center pt-4">
            <span class="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </span>
            <h2 class="text-2xl font-black">¡Entrenamiento Finalizado!</h2>
            <p class="text-sm text-[var(--muted-foreground)]">${session.routineName}</p>
          </div>

          <!-- Tarjetas de métricas -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-[var(--card)] p-3.5 rounded-2xl border border-[var(--card-border)] text-center">
              <span class="text-xs text-[var(--muted-foreground)] block">Tiempo</span>
              <span class="text-xl font-bold font-mono text-[var(--primary)]">${session.durationMinutes} min</span>
            </div>
            <div class="bg-[var(--card)] p-3.5 rounded-2xl border border-[var(--card-border)] text-center">
              <span class="text-xs text-[var(--muted-foreground)] block">Series</span>
              <span class="text-xl font-bold font-mono text-emerald-400">${session.totalSetsCompleted}/${session.totalSetsPlanned}</span>
            </div>
            <div class="bg-[var(--card)] p-3.5 rounded-2xl border border-[var(--card-border)] text-center">
              <span class="text-xs text-[var(--muted-foreground)] block">Volumen</span>
              <span class="text-xl font-bold font-mono text-amber-400">${session.totalVolumeKg.toLocaleString()} kg</span>
            </div>
          </div>

          <!-- Propuestas de Progresión Inteligente -->
          ${session.progressionProposals.length > 0 ? `
            <div class="bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] space-y-3">
              <div class="flex items-center gap-2">
                <span class="text-base">⚡</span>
                <h4 class="font-bold text-sm">Propuestas de Progresión IA (Requieren confirmación)</h4>
              </div>
              <div class="space-y-3">
                ${session.progressionProposals.map(p => `
                  <div class="p-3 rounded-xl ${p.progression.safetyAlert ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-[var(--background)] border border-[var(--card-border)]'} text-xs space-y-2">
                    <div class="flex justify-between font-semibold">
                      <span>${p.exerciseName}</span>
                      <span class="${p.progression.proposedWeightDelta > 0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}">
                        ${p.progression.currentWeight} kg → ${p.progression.proposedWeight} kg
                      </span>
                    </div>
                    <p class="text-[var(--muted-foreground)]">${p.progression.reason}</p>
                    <div class="flex gap-2 pt-1">
                      <button onclick="WorkoutEngine.acceptProgression('${p.exerciseId}', ${p.progression.proposedWeight})" class="flex-1 py-1.5 bg-[var(--primary)] text-white font-semibold rounded-lg text-xs">
                        Aceptar cambio
                      </button>
                      <button onclick="this.parentElement.innerHTML='<span class=\\'text-xs text-neutral-400\\'>Mantenido sin cambios</span>'" class="px-3 py-1.5 border border-[var(--card-border)] text-[var(--muted-foreground)] rounded-lg text-xs">
                        Mantener actual
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="p-4 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] text-xs text-[var(--muted-foreground)]">
              Cargas óptimas consolidadas. No se detectan anomalías para la próxima sesión.
            </div>
          `}

          <!-- Cuestionario rápido post-entrenamiento -->
          <div class="bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] space-y-3">
            <h4 class="font-bold text-sm">Sensaciones Post-Entreno</h4>
            <div>
              <label class="text-xs text-[var(--muted-foreground)] block mb-1">¿Cómo ha sido tu energía general?</label>
              <div class="grid grid-cols-3 gap-2">
                <button onclick="this.classList.toggle('bg-emerald-500/20')" class="p-2 rounded-xl border border-[var(--card-border)] text-xs font-medium">Buena</button>
                <button onclick="this.classList.toggle('bg-amber-500/20')" class="p-2 rounded-xl border border-[var(--card-border)] text-xs font-medium">Normal</button>
                <button onclick="this.classList.toggle('bg-red-500/20')" class="p-2 rounded-xl border border-[var(--card-border)] text-xs font-medium">Baja / Fatiga</button>
              </div>
            </div>
            <div>
              <label class="text-xs text-[var(--muted-foreground)] block mb-1">¿Molestias lumbares tras terminar?</label>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <button class="p-2 rounded-xl border border-emerald-500/40 text-emerald-300 font-medium">Sin molestias lumbares</button>
                <button class="p-2 rounded-xl border border-amber-500/40 text-amber-300 font-medium">Ligera sobrecarga</button>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-6 pb-2">
          <button onclick="document.getElementById('live-workout-container').classList.add('hidden'); window.MainApp.switchTab('inicio');" 
            class="w-full py-4 bg-[var(--primary)] text-white text-base font-bold rounded-2xl shadow-lg active:scale-95 transition">
            Volver al Inicio
          </button>
        </div>
      </div>
    `;
    modal.classList.remove("hidden");
  }

  acceptProgression(exerciseId, newWeight) {
    const routines = window.AppStore.getRoutines();
    routines.forEach(r => {
      r.exercises.forEach(ex => {
        if (ex.exerciseId === exerciseId) {
          ex.targetWeight = newWeight;
        }
      });
    });
    window.AppStore.set(STORAGE_KEYS.ROUTINES, routines);
    alert(`¡Actualizado! El peso objetivo para las próximas sesiones será de ${newWeight} kg.`);
  }

  cancelWorkout() {
    if (confirm("¿Seguro que deseas salir del entrenamiento actual? Los datos no guardados se perderán.")) {
      this.stopRestTimer();
      if (this.sessionTimerInterval) clearInterval(this.sessionTimerInterval);
      window.AppStore.clearActiveWorkout();
      this.activeWorkout = null;
      const modal = document.getElementById("live-workout-container");
      if (modal) modal.classList.add("hidden");
      window.MainApp.switchTab("entrenar");
    }
  }

  // Render principal de la pantalla de entrenamiento en directo
  renderLiveWorkoutModal() {
    const container = document.getElementById("live-workout-container");
    if (!container || !this.activeWorkout) return;

    container.classList.remove("hidden");

    const w = this.activeWorkout;
    const currentEx = w.exercises[w.currentExerciseIndex];

    container.innerHTML = `
      <div class="fixed inset-0 bg-[var(--background)] z-40 flex flex-col h-full text-[var(--foreground)]">
        <!-- Barra superior fija con cronómetro y controles -->
        <div class="bg-[var(--card)] border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between shadow-sm">
          <div>
            <span class="text-xs text-[var(--muted-foreground)] block font-medium uppercase tracking-wider">${w.category}</span>
            <h2 class="text-base font-bold truncate max-w-[200px] sm:max-w-xs">${w.routineName}</h2>
          </div>
          <div class="flex items-center gap-2">
            <div class="bg-[var(--background)] border border-[var(--card-border)] px-3 py-1.5 rounded-xl font-mono text-base font-black text-[var(--primary)] flex items-center gap-1.5" id="workout-session-timer">
              00:00
            </div>
            <button onclick="WorkoutEngine.finishWorkout()" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition">
              FINALIZAR
            </button>
            <button onclick="WorkoutEngine.cancelWorkout()" class="p-1.5 text-[var(--muted-foreground)] hover:text-red-400 text-lg">
              ✕
            </button>
          </div>
        </div>

        <!-- Banner de temporizador de descanso flotante -->
        <div id="rest-timer-banner" class="hidden bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between text-xs transition-all">
          <div class="flex items-center gap-2">
            <span class="animate-pulse text-emerald-400 font-bold">⏱ DESCANSO:</span>
            <span id="rest-timer-countdown" class="font-mono text-base font-black text-emerald-400">01:30</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="WorkoutEngine.adjustRestTimer(-15)" class="px-2 py-1 bg-[var(--card)] border border-[var(--card-border)] rounded-lg font-bold text-xs">-15s</button>
            <button onclick="WorkoutEngine.adjustRestTimer(30)" class="px-2 py-1 bg-[var(--card)] border border-[var(--card-border)] rounded-lg font-bold text-xs">+30s</button>
            <button onclick="WorkoutEngine.stopRestTimer()" class="px-2.5 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold">Saltar</button>
          </div>
        </div>

        <!-- Navegador horizontal de ejercicios -->
        <div class="flex overflow-x-auto gap-2 p-3 bg-[var(--card)]/50 border-b border-[var(--card-border)] no-scrollbar">
          ${w.exercises.map((ex, idx) => {
            const isCurrent = idx === w.currentExerciseIndex;
            const completedCount = ex.sets.filter(s => s.completed).length;
            const allDone = completedCount === ex.sets.length;
            return `
              <button onclick="WorkoutEngine.selectExerciseTab(${idx})" 
                class="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5
                ${isCurrent ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow' : 'bg-[var(--card)] border-[var(--card-border)] text-[var(--muted-foreground)]'}">
                <span>${idx + 1}. ${ex.name.substring(0, 15)}...</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded-full ${allDone ? 'bg-emerald-500 text-white' : 'bg-black/30'}">
                  ${completedCount}/${ex.sets.length}
                </span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Cuerpo del ejercicio actual (optimizado para una mano y dedos en el gimnasio) -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 max-w-xl mx-auto w-full pb-24">
          <!-- Tarjeta de información del ejercicio -->
          <div class="bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] space-y-2 shadow-sm">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">${currentEx.muscleGroup} • ${currentEx.equipment}</span>
                <h3 class="text-xl font-black text-[var(--foreground)]">${currentEx.name}</h3>
              </div>
              ${currentEx.safetyTag ? `
                <span class="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-lg flex items-center gap-1">
                  🛡 ${currentEx.safetyTag}
                </span>
              ` : ''}
            </div>
            ${currentEx.notes ? `
              <p class="text-xs text-[var(--muted-foreground)] leading-relaxed bg-[var(--background)] p-2.5 rounded-xl border border-[var(--card-border)]">
                💡 ${currentEx.notes}
              </p>
            ` : ''}
          </div>

          <!-- Tabla de series interactiva con botones grandes -->
          <div class="space-y-2.5">
            <div class="grid grid-cols-12 gap-2 text-[11px] font-bold text-[var(--muted-foreground)] px-2 uppercase tracking-wider">
              <span class="col-span-1 text-center">Set</span>
              <span class="col-span-3 text-center">Anterior</span>
              <span class="col-span-3 text-center">Kg</span>
              <span class="col-span-3 text-center">Reps</span>
              <span class="col-span-2 text-center">Hecho</span>
            </div>

            ${currentEx.sets.map((set, sIdx) => {
              const isDone = set.completed;
              return `
                <div class="grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl border transition ${isDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--card)] border-[var(--card-border)]'}">
                  <!-- Número de serie -->
                  <div class="col-span-1 text-center font-bold text-sm text-[var(--muted-foreground)]">
                    ${set.setNumber}
                  </div>

                  <!-- Info previa -->
                  <div class="col-span-3 text-center text-[10px] text-[var(--muted-foreground)] truncate px-1">
                    ${set.previousInfo}
                  </div>

                  <!-- Ajuste de Peso con controles rápidos -->
                  <div class="col-span-3 flex items-center justify-center bg-[var(--background)] rounded-xl border border-[var(--card-border)] px-1 py-1">
                    <button onclick="WorkoutEngine.updateSetValues(${w.currentExerciseIndex}, ${sIdx}, 'weight', -2.5)" class="w-6 h-7 flex items-center justify-center text-sm font-bold text-[var(--muted-foreground)] hover:text-white">-</button>
                    <span class="text-xs font-black font-mono flex-1 text-center">${set.weight}</span>
                    <button onclick="WorkoutEngine.updateSetValues(${w.currentExerciseIndex}, ${sIdx}, 'weight', 2.5)" class="w-6 h-7 flex items-center justify-center text-sm font-bold text-[var(--muted-foreground)] hover:text-white">+</button>
                  </div>

                  <!-- Ajuste de Reps -->
                  <div class="col-span-3 flex items-center justify-center bg-[var(--background)] rounded-xl border border-[var(--card-border)] px-1 py-1">
                    <button onclick="WorkoutEngine.updateSetValues(${w.currentExerciseIndex}, ${sIdx}, 'reps', -1)" class="w-6 h-7 flex items-center justify-center text-sm font-bold text-[var(--muted-foreground)] hover:text-white">-</button>
                    <span class="text-xs font-black font-mono flex-1 text-center">${set.actualReps}</span>
                    <button onclick="WorkoutEngine.updateSetValues(${w.currentExerciseIndex}, ${sIdx}, 'reps', 1)" class="w-6 h-7 flex items-center justify-center text-sm font-bold text-[var(--muted-foreground)] hover:text-white">+</button>
                  </div>

                  <!-- Checkbox gigante táctil de 1 toque -->
                  <div class="col-span-2 flex justify-center">
                    <button onclick="WorkoutEngine.toggleSetCompleted(${w.currentExerciseIndex}, ${sIdx})" 
                      class="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition active:scale-90
                      ${isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-[var(--background)] border-2 border-[var(--card-border)] text-transparent hover:border-[var(--primary)]'}">
                      ✓
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Barra de navegación inferior entre ejercicios y botón Deshacer -->
          <div class="flex items-center justify-between pt-4 gap-3">
            <button onclick="WorkoutEngine.prevExercise()" 
              ${w.currentExerciseIndex === 0 ? 'disabled class="opacity-30 px-4 py-3 rounded-xl border border-[var(--card-border)] text-xs font-bold"' : 'class="px-4 py-3 bg-[var(--card)] border border-[var(--card-border)] rounded-xl text-xs font-bold hover:bg-[var(--background)]"'}>
              ← Anterior
            </button>

            ${this.lastActionSetRef ? `
              <button onclick="WorkoutEngine.undoLastAction()" class="px-3 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1">
                ↺ Deshacer serie
              </button>
            ` : ''}

            <button onclick="WorkoutEngine.nextExercise()" 
              ${w.currentExerciseIndex === w.exercises.length - 1 ? 'disabled class="opacity-30 px-4 py-3 rounded-xl border border-[var(--card-border)] text-xs font-bold"' : 'class="px-4 py-3 bg-[var(--primary)] text-white rounded-xl text-xs font-bold hover:opacity-90 shadow"'}>
              Siguiente →
            </button>
          </div>
        </div>

        <!-- Contenedor para el modal de preguntas rápidas -->
        <div id="quick-prompt-modal"></div>
      </div>
    `;

    this.updateTimerDisplays();
  }

  selectExerciseTab(idx) {
    if (!this.activeWorkout) return;
    this.activeWorkout.currentExerciseIndex = idx;
    this.renderLiveWorkoutModal();
  }

  nextExercise() {
    if (!this.activeWorkout) return;
    if (this.activeWorkout.currentExerciseIndex < this.activeWorkout.exercises.length - 1) {
      this.activeWorkout.currentExerciseIndex++;
      this.renderLiveWorkoutModal();
    }
  }

  prevExercise() {
    if (!this.activeWorkout) return;
    if (this.activeWorkout.currentExerciseIndex > 0) {
      this.activeWorkout.currentExerciseIndex--;
      this.renderLiveWorkoutModal();
    }
  }
}

window.WorkoutEngine = new WorkoutManager();
