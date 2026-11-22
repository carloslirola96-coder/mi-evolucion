/**
 * MI EVOLUCIÓN - Motor de Reglas Biomecánicas, Progresión y Seguridad Clínica
 * Basado en evidencia científica y protocolos de rehabilitación vertebral/articular.
 */

const ClinicalRules = {
  // Banderas Rojas Médicas (Red Flags) para columna lumbar
  checkRedFlags(symptoms) {
    const redFlags = [
      { id: "cauda_equina_anesthesia", text: "Pérdida de sensibilidad o anestesia en zona genital/perineal (en silla de montar)", urgent: true },
      { id: "cauda_equina_sphincter", text: "Pérdida súbita del control de la vejiga o intestino (incontinencia o retención urinaria)", urgent: true },
      { id: "progressive_weakness", text: "Debilidad muscular severa o progresiva en las piernas (dificultad para caminar o ponerse de puntillas/talones)", urgent: true },
      { id: "night_pain_fever", text: "Dolor lumbar nocturno severo constante acompañado de fiebre sin causa aparente", urgent: true }
    ];

    const alerts = [];
    if (symptoms) {
      if (symptoms.numbnessSaddle) alerts.push(redFlags[0]);
      if (symptoms.sphincterLoss) alerts.push(redFlags[1]);
      if (symptoms.progressiveMotorLoss) alerts.push(redFlags[2]);
    }

    return {
      hasUrgentAlert: alerts.length > 0,
      alerts: alerts,
      disclaimer: "La aplicación y la IA no sustituyen la valoración del traumatólogo ni del fisioterapeuta colegiado."
    };
  },

  // Reglas de progresión inteligente (Doble progresión + Control de síntomas)
  evaluateProgression(exerciseId, targetSets, targetRepsRange, completedSets, previousSessions) {
    const exercise = window.AppStore.getExerciseById(exerciseId);
    if (!exercise || !completedSets || completedSets.length === 0) {
      return { recommendation: "maintain", reason: "Sin datos suficientes." };
    }

    // Parsing rango objetivo (ejemplo "8-12" -> min: 8, max: 12)
    let minReps = 8;
    let maxReps = 12;
    if (typeof targetRepsRange === 'string' && targetRepsRange.includes('-')) {
      const parts = targetRepsRange.split('-').map(s => parseInt(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        minReps = parts[0];
        maxReps = parts[1];
      }
    } else if (!isNaN(parseInt(targetRepsRange))) {
      maxReps = parseInt(targetRepsRange);
      minReps = maxReps;
    }

    // 1. Comprobar si hubo reporte de dolor en la sesión
    const hasLumbarPain = completedSets.some(s => s.painLocation === 'lumbar' && (s.painLevel || 0) > 2);
    const hasShoulderPain = completedSets.some(s => s.painLocation === 'hombro' && (s.painLevel || 0) > 2);

    if (hasLumbarPain) {
      return {
        action: "reduce_or_deload",
        proposedWeightDelta: -0.1, // sugerir -10% o pausar
        currentWeight: completedSets[0].weight || 0,
        proposedWeight: Math.max(0, Math.round(((completedSets[0].weight || 0) * 0.9) * 2) / 2),
        reason: "Has registrado molestias lumbares durante la ejecución. Por seguridad de tus protrusiones discales L2-S1, se recomienda reducir carga o revisar con tu fisioterapeuta antes de progresar.",
        safetyAlert: true,
        requiresConfirmation: true
      };
    }

    if (hasShoulderPain && exercise.safetyTag && exercise.safetyTag.includes("SLAP")) {
      return {
        action: "freeze_load",
        proposedWeightDelta: 0,
        currentWeight: completedSets[0].weight || 0,
        proposedWeight: completedSets[0].weight || 0,
        reason: "Has registrado molestia en el hombro derecho. Dada tu lesión de labrum (SLAP), congelamos la carga y sugerimos revisar el recorrido articular.",
        safetyAlert: true,
        requiresConfirmation: true
      };
    }

    // 2. Comprobar si todas las series alcanzaron el techo de repeticiones
    const allSetsHitCeiling = completedSets.every(s => s.completed && (s.actualReps || 0) >= maxReps);
    const avgRIR = completedSets.reduce((acc, s) => acc + (s.rir !== undefined ? s.rir : 2), 0) / completedSets.length;
    const currentWeight = completedSets[0].weight || 0;

    if (allSetsHitCeiling && avgRIR >= 1.5) {
      // Progresión recomendada: incremento pequeño (+1 kg en mancuernas/poleas, +2.5 kg en máquinas grandes)
      const increment = exercise.equipment.includes("Mancuerna") || currentWeight < 20 ? 1.0 : 2.5;
      const newProposedWeight = currentWeight + increment;

      return {
        action: "increase_weight",
        proposedWeightDelta: increment,
        currentWeight: currentWeight,
        proposedWeight: newProposedWeight,
        reason: `Has completado con éxito todas las series al máximo del rango (${maxReps} reps) con un RIR medio de ${avgRIR.toFixed(1)} y sin molestias articulares. Proponemos un aumento moderado de +${increment} kg para la próxima sesión.`,
        safetyAlert: false,
        requiresConfirmation: true
      };
    } else if (completedSets.every(s => s.completed && (s.actualReps || 0) >= minReps)) {
      return {
        action: "maintain_and_seek_reps",
        proposedWeightDelta: 0,
        currentWeight: currentWeight,
        proposedWeight: currentWeight,
        reason: `Buen rendimiento dentro del rango (${minReps}-${maxReps} reps). Mantén el peso actual (${currentWeight} kg) e intenta ganar 1 repetición más por serie antes de subir carga.`,
        safetyAlert: false,
        requiresConfirmation: false
      };
    } else {
      return {
        action: "maintain_or_adapt",
        proposedWeightDelta: 0,
        currentWeight: currentWeight,
        proposedWeight: currentWeight,
        reason: `No se ha alcanzado el mínimo del rango previsto (${minReps} reps) en todas las series. Se recomienda consolidar la carga actual (${currentWeight} kg) y asegurar descansos completos.`,
        safetyAlert: false,
        requiresConfirmation: false
      };
    }
  },

  // Cálculo de volumen semanal por grupo muscular (Series efectivas directas)
  calculateWeeklyVolume(completedSessions) {
    const oneWeekAgo = Date.now() - 7 * 86400000;
    const recentSessions = completedSessions.filter(s => new Date(s.endTime || s.date).getTime() >= oneWeekAgo);

    const volumeMap = {
      "Pectoral": 0,
      "Espalda": 0,
      "Hombro (Lateral/Post)": 0,
      "Bíceps": 0,
      "Tríceps": 0,
      "Cuádriceps": 0,
      "Isquiotibiales": 0,
      "Glúteos": 0,
      "Gemelos": 0,
      "Core y Estabilidad": 0
    };

    recentSessions.forEach(session => {
      (session.exercises || []).forEach(ex => {
        const exerciseData = window.AppStore.getExerciseById(ex.exerciseId);
        if (!exerciseData) return;

        const effectiveSets = (ex.sets || []).filter(s => s.completed).length;
        const mg = exerciseData.muscleGroup;

        if (mg.includes("Pectoral")) volumeMap["Pectoral"] += effectiveSets;
        else if (mg.includes("Espalda")) volumeMap["Espalda"] += effectiveSets;
        else if (mg.includes("Hombro")) volumeMap["Hombro (Lateral/Post)"] += effectiveSets;
        else if (mg.includes("Bíceps")) volumeMap["Bíceps"] += effectiveSets;
        else if (mg.includes("Tríceps")) volumeMap["Tríceps"] += effectiveSets;
        else if (mg.includes("Cuádriceps")) volumeMap["Cuádriceps"] += effectiveSets;
        else if (mg.includes("Isquiotibiales")) volumeMap["Isquiotibiales"] += effectiveSets;
        else if (mg.includes("Glúteo")) volumeMap["Glúteos"] += effectiveSets;
        else if (mg.includes("Gemelo")) volumeMap["Gemelos"] += effectiveSets;
        else if (mg.includes("Core") || mg.includes("Columna")) volumeMap["Core y Estabilidad"] += effectiveSets;
      });
    });

    return volumeMap;
  },

  // Guías de rangos semanales óptimos para hipertrofia con 3 sesiones (Schoenfeld et al.)
  getOptimalVolumeTargets() {
    return {
      "Pectoral": { min: 8, optimal: 12, max: 16, note: "Prioridad del usuario" },
      "Espalda": { min: 8, optimal: 12, max: 16, note: "Fundamental para postura" },
      "Hombro (Lateral/Post)": { min: 8, optimal: 12, max: 16, note: "Prioridad del usuario" },
      "Bíceps": { min: 4, optimal: 8, max: 12, note: "Cuidado epicóndilo" },
      "Tríceps": { min: 4, optimal: 8, max: 12, note: "Cuidado inserción tríceps" },
      "Cuádriceps": { min: 6, optimal: 10, max: 14, note: "Prioridad del usuario" },
      "Isquiotibiales": { min: 6, optimal: 8, max: 12, note: "Clave para pádel y columna" },
      "Glúteos": { min: 6, optimal: 8, max: 12, note: "Protector de columna lumbar" },
      "Gemelos": { min: 6, optimal: 8, max: 12, note: "Reactividad en pádel" },
      "Core y Estabilidad": { min: 4, optimal: 8, max: 14, note: "Rutina doméstica prioritaria" }
    };
  }
};

window.ClinicalRules = ClinicalRules;
