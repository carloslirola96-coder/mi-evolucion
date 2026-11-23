/**
 * MI EVOLUCIÓN - Sistema de Estado y Persistencia Local
 * Almacenamiento privado en localStorage e IndexedDB.
 * Libre de dependencias externas obligatorias.
 */

const STORAGE_KEYS = {
  PROFILE: 'mi_evolucion_profile',
  EXERCISES: 'mi_evolucion_exercises',
  ROUTINES: 'mi_evolucion_routines',
  SESSIONS: 'mi_evolucion_sessions',
  ACTIVE_WORKOUT: 'mi_evolucion_active_workout',
  NUTRITION_LOG: 'mi_evolucion_nutrition_log',
  EVOLUTION_LOG: 'mi_evolucion_evolution_log',
  AI_CHAT: 'mi_evolucion_ai_chat',
  SETTINGS: 'mi_evolucion_settings'
};

// Perfil inicial detallado del usuario (Carlo, 29 años)
const INITIAL_PROFILE = {
  name: "Carlo",
  sex: "Hombre",
  age: 29,
  height: 180,
  weight: 74.0,
  gym: "Synergym Vega de Acá, Almería",
  mainSport: "Pádel (nivel competitivo - en readaptación)",
  sleepHours: 7,
  dailyRoutine: {
    work: "Oficina (08:00 - 15:00)",
    study: "Oposiciones (16:30 - 20:30)",
    dogWalks: "Paseos diarios con su perra Dina",
    gymTime: "Noche (máx 60 min, 3 días/semana)",
    homeCore: "Rutina doméstica de 5-10 min"
  },
  goals: [
    "Desarrollar un cuerpo musculoso, atlético, proporcionado y definido.",
    "Ganar varios kilos de masa muscular sin peso arbitrario.",
    "Reducir grasa en abdomen y cintura progresivamente.",
    "Prioridad muscular: Pecho, hombros y piernas. También espalda, brazos, glúteos y gemelos.",
    "Recuperar la capacidad funcional lumbar completa.",
    "Volver a competir al pádel con preparación física superior.",
    "Horizonte: 12 meses con revisiones periódicas."
  ],
  medicalHistory: {
    lumbar: {
      condition: "Protrusiones discales en L2-L3, L3-L4, L4-L5 y L5-S1",
      acuteEpisode: "Noviembre 2026 (dolor principalmente lumbar)",
      symptoms: "Flexión lumbar hacia delante provoca más molestia que extensión. Sentado prolongado genera molestias. Caminar se tolera bien.",
      status: "Mejoría progresiva. Fallos en piernas desaparecidos. En fase de readaptación y fortalecimiento del tronco.",
      precautions: "Evitar flexión forzada con carga axial (peso muerto pesado, sentadilla libre pesada). Priorizar apoyo pectoral en remos y zancadas/máquinas."
    },
    shoulderRight: {
      condition: "Lesión SLAP del labrum del hombro derecho",
      precautions: "Evitar rotaciones extremas bajo carga y recorridos articulares excesivamente profundos en empujes. Priorizar plano escapular (30°)."
    },
    elbowArm: {
      condition: "Problemas previos en inserción del tríceps y antecedente de epicondilitis",
      precautions: "Calentamiento articular, evitar bloqueos bruscos de codo en poleas y presses."
    },
    systemicAndNutrition: {
      conditions: [
        "Enfermedad celíaca (dieta 100% estricta sin gluten, riesgo contaminación cruzada)",
        "Intolerancia a la lactosa",
        "Hernia de hiato y antecedentes de gastritis / H. pylori",
        "Antecedente de anemia",
        "Episodios previos de hipertensión arterial",
        "Reacción temporal renal/hepática no aclarada con creatina previa (NO recomendar creatina)"
      ]
    }
  },
  nutritionTargets: {
    dailyCalories: 2250,
    proteinGrams: 140, // ~1.9 g/kg para 74kg
    carbsGrams: 260,
    fatGrams: 65,
    waterLiters: 2.8
  }
};

// Biblioteca completa de ejercicios iniciales con consideraciones clínicas
const INITIAL_EXERCISES = [
  {
    id: "ex_press_pecho_maq",
    name: "Press de pecho en máquina",
    muscleGroup: "Pectoral",
    secondaryMuscles: ["Tríceps", "Deltoides anterior"],
    equipment: "Máquina guiada",
    recommendedSets: "3-4",
    recommendedReps: "8-12",
    recommendedRestSeconds: 90,
    notes: "Ajustar el asiento a la altura del pezón medio. Mantener retracción escapular y no llevar los codos por detrás de la línea del cuerpo para proteger el labrum del hombro derecho (SLAP).",
    safetyTag: "Ajuste SLAP hombro",
    axialLoad: "Baja (espalda apoyada en respaldo)"
  },
  {
    id: "ex_remo_pecho_apoyado",
    name: "Remo con pecho apoyado",
    muscleGroup: "Espalda",
    secondaryMuscles: ["Deltoides posterior", "Bíceps"],
    equipment: "Máquina o banco inclinado",
    recommendedSets: "3-4",
    recommendedReps: "8-12",
    recommendedRestSeconds: 90,
    notes: "El apoyo esternal descarga por completo la compresión en L2-S1. Mantener cuello neutro y traccionar llevando los codos hacia las caderas.",
    safetyTag: "Seguro lumbar (sin carga axial)",
    axialLoad: "Nula"
  },
  {
    id: "ex_zancada_estatica",
    name: "Zancada estática (Split Squat)",
    muscleGroup: "Piernas (Cuádriceps/Glúteo)",
    secondaryMuscles: ["Isquiotibiales", "Gemelos"],
    equipment: "Mancuernas / Peso corporal",
    recommendedSets: "3",
    recommendedReps: "8-10 por pierna",
    recommendedRestSeconds: 90,
    notes: "Mantener el torso vertical con columna lumbar neutra. La zancada unilateral reduce a la mitad la carga absoluta sobre la columna comparada con una sentadilla bilateral.",
    safetyTag: "Baja carga axial lumbar",
    axialLoad: "Baja/Moderada"
  },
  {
    id: "ex_extension_cuadriceps",
    name: "Extensión de cuádriceps en máquina",
    muscleGroup: "Piernas (Cuádriceps)",
    secondaryMuscles: [],
    equipment: "Máquina",
    recommendedSets: "3",
    recommendedReps: "10-15",
    recommendedRestSeconds: 75,
    notes: "Ajustar el rodillo sobre los tobillos. Estabilidad total en la espalda, permite llegar a fallo muscular del cuádriceps con CERO riesgo para la zona lumbar.",
    safetyTag: "Cero carga lumbar",
    axialLoad: "Nula"
  },
  {
    id: "ex_curl_femoral",
    name: "Curl femoral sentado o tumbado",
    muscleGroup: "Piernas (Isquiotibiales)",
    secondaryMuscles: ["Gemelos"],
    equipment: "Máquina",
    recommendedSets: "3",
    recommendedReps: "10-12",
    recommendedRestSeconds: 75,
    notes: "En versión tumbado evitar arquear la zona lumbar. Mantener la pelvis pegada al banco. Fortalecimiento clave de cadena posterior para pádel.",
    safetyTag: "Estabilidad pélvica",
    axialLoad: "Nula"
  },
  {
    id: "ex_elevaciones_laterales",
    name: "Elevaciones laterales",
    muscleGroup: "Hombros (Deltoides lateral)",
    secondaryMuscles: ["Trapecio"],
    equipment: "Mancuernas o polea",
    recommendedSets: "3-4",
    recommendedReps: "12-15",
    recommendedRestSeconds: 60,
    notes: "Realizar en el plano escapular (brazos unos 30° adelantados, no completamente abiertos en cruz). Pulgares ligeramente hacia arriba para no pinzar el labrum/manguito rotador derecho.",
    safetyTag: "Protección SLAP hombro",
    axialLoad: "Baja"
  },
  {
    id: "ex_curl_biceps",
    name: "Curl de bíceps en polea o mancuernas",
    muscleGroup: "Brazos (Bíceps)",
    secondaryMuscles: ["Braquial", "Antebrazo"],
    equipment: "Mancuernas o polea",
    recommendedSets: "3",
    recommendedReps: "10-12",
    recommendedRestSeconds: 60,
    notes: "Mantener muñeca neutra sin flexión extrema para no sobrecargar el epicóndilo. Rango de movimiento controlado.",
    safetyTag: "Cuidado epicóndilo",
    axialLoad: "Nula"
  },
  {
    id: "ex_press_inclinado_maq",
    name: "Press inclinado en máquina",
    muscleGroup: "Pectoral (Haz clavicular)",
    secondaryMuscles: ["Deltoides anterior", "Tríceps"],
    equipment: "Máquina guiada",
    recommendedSets: "3",
    recommendedReps: "8-12",
    recommendedRestSeconds: 90,
    notes: "Inclinación moderada (~30°). Permite enfatizar la zona superior del pecho con trayectoria guiada y segura para el hombro.",
    safetyTag: "Ajuste SLAP hombro",
    axialLoad: "Baja"
  },
  {
    id: "ex_jalon_pecho",
    name: "Jalón al pecho con agarre neutro o prono",
    muscleGroup: "Espalda (Dorsal ancho)",
    secondaryMuscles: ["Bíceps", "Deltoides posterior"],
    equipment: "Polea alta",
    recommendedSets: "3-4",
    recommendedReps: "8-12",
    recommendedRestSeconds: 90,
    notes: "Bajar la barra al esternón alto con ligera inclinación de tronco (15°). NUNCA tras la nuca. Excelente para descompresión lumbar colgado en la polea.",
    safetyTag: "Efecto descompresión axial",
    axialLoad: "Negativa/Descompresión"
  },
  {
    id: "ex_step_up",
    name: "Subida a banco bajo (Step-up)",
    muscleGroup: "Piernas (Glúteo/Cuádriceps)",
    secondaryMuscles: ["Gemelos", "Estabilizadores cadera"],
    equipment: "Banco bajo (20-30 cm)",
    recommendedSets: "3",
    recommendedReps: "8-10 por pierna",
    recommendedRestSeconds: 75,
    notes: "Pisar con todo el pie, impulsar con la pierna de arriba sin saltar con la de abajo. Gran transferencia a los desplazamientos de pádel.",
    safetyTag: "Transferencia atlética",
    axialLoad: "Baja"
  },
  {
    id: "ex_puente_gluteo",
    name: "Puente de glúteos en suelo",
    muscleGroup: "Glúteos",
    secondaryMuscles: ["Isquiotibiales", "Erectores espinales"],
    equipment: "Suelo / Esterilla",
    recommendedSets: "3",
    recommendedReps: "12-15",
    recommendedRestSeconds: 60,
    notes: "Apretar glúteos arriba sin hiperextender la columna lumbar. Excelente activación para proteger la zona lumbar y mejorar la cadera.",
    safetyTag: "Rehabilitación lumbar",
    axialLoad: "Nula"
  },
  {
    id: "ex_pajaro_maquina",
    name: "Aperturas posteriores en máquina (Pájaro)",
    muscleGroup: "Hombros (Deltoides posterior)",
    secondaryMuscles: ["Romboides", "Trapecio"],
    equipment: "Máquina contractora invertida",
    recommendedSets: "3",
    recommendedReps: "12-15",
    recommendedRestSeconds: 60,
    notes: "Fortalece la parte posterior del hombro, balanceando la articulación gleno-humeral y protegiendo el labrum.",
    safetyTag: "Estabilidad escapular",
    axialLoad: "Nula"
  },
  {
    id: "ex_gemelos_maquina",
    name: "Gemelos de pie o en prensa",
    muscleGroup: "Gemelos (Gastrocnemio y Sóleo)",
    secondaryMuscles: [],
    equipment: "Máquina o escalón",
    recommendedSets: "3-4",
    recommendedReps: "12-15",
    recommendedRestSeconds: 60,
    notes: "Pausa de 2 segundos en el estiramiento abajo y contracción arriba. Fundamental para la reactividad en pista de pádel.",
    safetyTag: "Seguro",
    axialLoad: "Baja"
  },
  {
    id: "ex_pallof_press",
    name: "Empuje antirrotación en polea (Pallof Press)",
    muscleGroup: "Core y tronco (Oblicuos/Transverso)",
    secondaryMuscles: ["Hombros"],
    equipment: "Polea o banda elástica",
    recommendedSets: "3",
    recommendedReps: "10-12 por lado",
    recommendedRestSeconds: 60,
    notes: "Ejercicio rey de estabilidad del tronco. El core resiste la rotación sin movimiento de columna lumbar, protegiendo las protrusiones discales.",
    safetyTag: "Oro para columna lumbar",
    axialLoad: "Nula"
  },
  {
    id: "ex_aperturas_pecho_maq",
    name: "Aperturas de pecho en máquina (Pec Deck)",
    muscleGroup: "Pectoral",
    secondaryMuscles: ["Deltoides anterior"],
    equipment: "Máquina",
    recommendedSets: "3",
    recommendedReps: "10-12",
    recommendedRestSeconds: 75,
    notes: "Limitar el estiramiento final para no someter a estrés la cápsula anterior del hombro derecho.",
    safetyTag: "Cuidado rango SLAP",
    axialLoad: "Nula"
  },
  {
    id: "ex_extension_triceps_polea",
    name: "Extensión de tríceps en polea alta",
    muscleGroup: "Brazos (Tríceps)",
    secondaryMuscles: [],
    equipment: "Polea con cuerda o barra recta",
    recommendedSets: "3",
    recommendedReps: "10-12",
    recommendedRestSeconds: 60,
    notes: "Mantener codos fijos a los lados del torso. No hiperextender el codo bruscamente para proteger la inserción tendinosa.",
    safetyTag: "Cuidado inserción tríceps",
    axialLoad: "Nula"
  },

  // Ejercicios específicos de la rutina doméstica CORE Y ESPALDA
  {
    id: "ex_core_heel_slide",
    name: "Deslizamiento de talón (Heel Slide)",
    muscleGroup: "Core profundo (Transverso abdominal)",
    secondaryMuscles: ["Flexores cadera"],
    equipment: "Suelo / Esterilla",
    recommendedSets: "1",
    recommendedReps: "8 por pierna",
    recommendedRestSeconds: 30,
    notes: "Tumbado boca arriba, rodillas flexionadas. Activar el abdomen suavemente manteniendo la curvatura lumbar natural. Deslizar lentamente un talón hasta estirar la pierna sin arquear la espalda.",
    safetyTag: "Fase 1 recuperación lumbar",
    axialLoad: "Nula"
  },
  {
    id: "ex_core_bird_dog",
    name: "Extensión alterna en cuadrupedia (Bird-Dog)",
    muscleGroup: "Core y multífidos espinales",
    secondaryMuscles: ["Glúteo mayor", "Deltoides"],
    equipment: "Suelo / Esterilla",
    recommendedSets: "2",
    recommendedReps: "6 por lado con pausa de 3s",
    recommendedRestSeconds: 45,
    notes: "A cuatro patas. Extender brazo derecho y pierna izquierda formando una línea recta horizontal. Mantener columna rígida y neutra, sin rotar la pelvis ni arquear la zona lumbar.",
    safetyTag: "Patrón de McGill para columna",
    axialLoad: "Nula"
  },
  {
    id: "ex_core_esfinge",
    name: "Extensión lumbar suave sobre antebrazos (Esfinge)",
    muscleGroup: "Columna lumbar (Descompresión posterior)",
    secondaryMuscles: [],
    equipment: "Suelo / Esterilla",
    recommendedSets: "5",
    recommendedReps: "10 segundos de mantenimiento",
    recommendedRestSeconds: 20,
    notes: "Tumbado boca abajo, apoyar los codos y antebrazos en el suelo elevando suavemente el pecho. Respirar relajado. REGLA: suspender inmediatamente si genera dolor; aplicar SOLO si alivia o centraliza molestias.",
    safetyTag: "Protocolo McKenzie adaptado",
    axialLoad: "Nula"
  },
  {
    id: "ex_core_estiramiento_psoas",
    name: "Estiramiento suave de flexores de cadera (Psoas)",
    muscleGroup: "Flexores de cadera (Psoas e ilíaco)",
    secondaryMuscles: ["Cuádriceps"],
    equipment: "Suelo / Cojín bajo rodilla",
    recommendedSets: "1-2",
    recommendedReps: "30 segundos por lado",
    recommendedRestSeconds: 30,
    notes: "Posición de caballero (una rodilla en el suelo). Bascular la pelvis hacia atrás (retroversión pélvica) apretando el glúteo de atrás. NO curvar la zona lumbar hacia adelante.",
    safetyTag: "Alivio tensión lumbar",
    axialLoad: "Nula"
  }
];

// Plantillas de rutinas iniciales editables
const INITIAL_ROUTINES = [
  {
    id: "rutina_dia_a",
    name: "DÍA A: Pectoral, Espalda y Tren Inferior",
    type: "hipertrofia",
    category: "Gimnasio",
    statusBadge: "Pendiente de valoración funcional",
    estimatedMinutes: 55,
    notes: "Sesión enfocada en hipertrofia equilibrada con 100% de ejercicios en máquina o carga axial controlada. Proteger hombro derecho en press.",
    exercises: [
      { exerciseId: "ex_press_pecho_maq", targetSets: 3, targetReps: "8-12", targetWeight: 40, restSeconds: 90 },
      { exerciseId: "ex_remo_pecho_apoyado", targetSets: 3, targetReps: "8-12", targetWeight: 35, restSeconds: 90 },
      { exerciseId: "ex_zancada_estatica", targetSets: 3, targetReps: "8-10", targetWeight: 10, restSeconds: 90 },
      { exerciseId: "ex_extension_cuadriceps", targetSets: 3, targetReps: "10-15", targetWeight: 30, restSeconds: 75 },
      { exerciseId: "ex_curl_femoral", targetSets: 3, targetReps: "10-12", targetWeight: 25, restSeconds: 75 },
      { exerciseId: "ex_elevaciones_laterales", targetSets: 3, targetReps: "12-15", targetWeight: 6, restSeconds: 60 },
      { exerciseId: "ex_curl_biceps", targetSets: 3, targetReps: "10-12", targetWeight: 10, restSeconds: 60 }
    ]
  },
  {
    id: "rutina_dia_b",
    name: "DÍA B: Pecho Inclinado, Dorsal y Cadena Posterior",
    type: "hipertrofia",
    category: "Gimnasio",
    statusBadge: "Pendiente de valoración funcional",
    estimatedMinutes: 55,
    notes: "Énfasis en pectoral clavicular, descompresión dorsal con jalón y estabilidad de core con Pallof press.",
    exercises: [
      { exerciseId: "ex_press_inclinado_maq", targetSets: 3, targetReps: "8-12", targetWeight: 35, restSeconds: 90 },
      { exerciseId: "ex_jalon_pecho", targetSets: 3, targetReps: "8-12", targetWeight: 45, restSeconds: 90 },
      { exerciseId: "ex_step_up", targetSets: 3, targetReps: "8-10", targetWeight: 8, restSeconds: 75 },
      { exerciseId: "ex_puente_gluteo", targetSets: 3, targetReps: "12-15", targetWeight: 0, restSeconds: 60 },
      { exerciseId: "ex_curl_femoral", targetSets: 3, targetReps: "10-12", targetWeight: 25, restSeconds: 75 },
      { exerciseId: "ex_pajaro_maquina", targetSets: 3, targetReps: "12-15", targetWeight: 20, restSeconds: 60 },
      { exerciseId: "ex_gemelos_maquina", targetSets: 3, targetReps: "12-15", targetWeight: 40, restSeconds: 60 },
      { exerciseId: "ex_pallof_press", targetSets: 3, targetReps: "10-12", targetWeight: 12, restSeconds: 60 }
    ]
  },
  {
    id: "rutina_dia_c",
    name: "DÍA C: Aislamiento Pectoral, Tracción y Brazos",
    type: "hipertrofia",
    category: "Gimnasio",
    statusBadge: "Pendiente de valoración funcional",
    estimatedMinutes: 55,
    notes: "Tercera sesión semanal. Volumen complementario para hombros, tríceps y cuádriceps sin fatiga articular excesiva.",
    exercises: [
      { exerciseId: "ex_aperturas_pecho_maq", targetSets: 3, targetReps: "10-12", targetWeight: 30, restSeconds: 75 },
      { exerciseId: "ex_remo_pecho_apoyado", targetSets: 3, targetReps: "8-12", targetWeight: 35, restSeconds: 90 },
      { exerciseId: "ex_zancada_estatica", targetSets: 3, targetReps: "8-10", targetWeight: 10, restSeconds: 90 },
      { exerciseId: "ex_extension_cuadriceps", targetSets: 3, targetReps: "10-15", targetWeight: 30, restSeconds: 75 },
      { exerciseId: "ex_curl_femoral", targetSets: 3, targetReps: "10-12", targetWeight: 25, restSeconds: 75 },
      { exerciseId: "ex_elevaciones_laterales", targetSets: 3, targetReps: "12-15", targetWeight: 6, restSeconds: 60 },
      { exerciseId: "ex_curl_biceps", targetSets: 3, targetReps: "10-12", targetWeight: 10, restSeconds: 60 },
      { exerciseId: "ex_extension_triceps_polea", targetSets: 3, targetReps: "10-12", targetWeight: 18, restSeconds: 60 }
    ]
  },
  {
    id: "rutina_core_espalda",
    name: "CORE Y ESPALDA: Rutina Doméstica de Recuperación",
    type: "readaptacion",
    category: "Doméstica",
    statusBadge: "Recomendada diaria / días alternos",
    estimatedMinutes: 8,
    notes: "Sesión corta de 5 a 10 minutos para realizar en casa. Objetivo: activar musculatura profunda, restaurar control lumbo-pélvico y aliviar síntomas.",
    exercises: [
      { exerciseId: "ex_core_heel_slide", targetSets: 1, targetReps: "8 por lado", targetWeight: 0, restSeconds: 30 },
      { exerciseId: "ex_puente_gluteo", targetSets: 2, targetReps: "10", targetWeight: 0, restSeconds: 45 },
      { exerciseId: "ex_core_bird_dog", targetSets: 2, targetReps: "6 por lado (pausa 3s)", targetWeight: 0, restSeconds: 45 },
      { exerciseId: "ex_core_esfinge", targetSets: 5, targetReps: "10s", targetWeight: 0, restSeconds: 20 },
      { exerciseId: "ex_core_estiramiento_psoas", targetSets: 1, targetReps: "30s por lado", targetWeight: 0, restSeconds: 30 }
    ]
  }
];

// Comidas de partida y alimentos frecuentes adaptados (sin gluten, sin lactosa, bar y cenas rápidas)
const INITIAL_NUTRITION_LOG = [
  {
    id: "meal_seed_1",
    date: new Date().toISOString().split('T')[0],
    mealType: "desayuno",
    name: "Media tostada sin gluten en bar con jamón y tomate",
    time: "10:30",
    estimatedCalories: 320,
    protein: 16,
    carbs: 38,
    fat: 11,
    verifiedGlutenFree: true,
    lactoseFree: true,
    confirmed: true,
    items: [
      { name: "Pan tostado sin gluten (media tostada)", amount: "60g", cal: 150, prot: 2, carbs: 32, fat: 1 },
      { name: "Jamón serrano / york", amount: "40g", cal: 90, prot: 12, carbs: 0, fat: 4 },
      { name: "Tomate rallado natural + aceite de oliva virgen extra", amount: "10g aceite + tomate", cal: 80, prot: 1, carbs: 3, fat: 7 }
    ]
  },
  {
    id: "meal_seed_2",
    date: new Date().toISOString().split('T')[0],
    mealType: "comida",
    name: "Arroz blanco casero con pechuga de pollo a la plancha",
    time: "14:30",
    estimatedCalories: 680,
    protein: 48,
    carbs: 82,
    fat: 14,
    verifiedGlutenFree: true,
    lactoseFree: true,
    confirmed: true,
    items: [
      { name: "Pechuga de pollo a la plancha", amount: "180g", cal: 290, prot: 44, carbs: 0, fat: 6 },
      { name: "Arroz blanco cocido", amount: "220g", cal: 285, prot: 6, carbs: 62, fat: 1 },
      { name: "Aceite de oliva virgen extra en cocinado", amount: "12g", cal: 105, prot: 0, carbs: 0, fat: 12 }
    ]
  }
];

// Mediciones iniciales
const INITIAL_EVOLUTION = [
  {
    id: "evo_initial",
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    weight: 74.0,
    waist: 84.5,
    chest: 101.0,
    armRight: 34.0,
    thighRight: 56.5,
    painLumbarScore: 2, // escala 0-10
    painShoulderScore: 1,
    notes: "Inicio de programa de readaptación funcional e hipertrofia."
  }
];

class StoreManager {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      this.set(STORAGE_KEYS.PROFILE, INITIAL_PROFILE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXERCISES)) {
      this.set(STORAGE_KEYS.EXERCISES, INITIAL_EXERCISES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROUTINES)) {
      this.set(STORAGE_KEYS.ROUTINES, INITIAL_ROUTINES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      this.set(STORAGE_KEYS.SESSIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NUTRITION_LOG)) {
      this.set(STORAGE_KEYS.NUTRITION_LOG, INITIAL_NUTRITION_LOG);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVOLUTION_LOG)) {
      this.set(STORAGE_KEYS.EVOLUTION_LOG, INITIAL_EVOLUTION);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, {
        progressionMode: "rules_with_confirmation", // 'manual' | 'rules_with_confirmation' | 'ai_assisted'
        askQuickQuestionsFrequency: "medium", // 'high' | 'medium' | 'low'
        audioFeedback: true,
        restTimerDurationDefault: 90,
        geminiApiKey: ""
      });
    }
  }

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error al leer ${key}:`, e);
      return null;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('store-updated', { detail: { key, value } }));
      return true;
    } catch (e) {
      console.error(`Error al guardar en ${key}:`, e);
      return false;
    }
  }

  // Métodos de acceso rápido
  getProfile() { return this.get(STORAGE_KEYS.PROFILE) || INITIAL_PROFILE; }
  saveProfile(profile) { return this.set(STORAGE_KEYS.PROFILE, profile); }

  getExercises() { return this.get(STORAGE_KEYS.EXERCISES) || []; }
  getExerciseById(id) { return this.getExercises().find(ex => ex.id === id); }
  saveExercise(exercise) {
    const list = this.getExercises();
    const idx = list.findIndex(e => e.id === exercise.id);
    if (idx >= 0) list[idx] = exercise;
    else list.push(exercise);
    return this.set(STORAGE_KEYS.EXERCISES, list);
  }

  getRoutines() { return this.get(STORAGE_KEYS.ROUTINES) || []; }
  getRoutineById(id) { return this.getRoutines().find(r => r.id === id); }
  saveRoutine(routine) {
    const list = this.getRoutines();
    const idx = list.findIndex(r => r.id === routine.id);
    if (idx >= 0) list[idx] = routine;
    else list.push(routine);
    return this.set(STORAGE_KEYS.ROUTINES, list);
  }
  deleteRoutine(id) {
    const list = this.getRoutines().filter(r => r.id !== id);
    return this.set(STORAGE_KEYS.ROUTINES, list);
  }

  getSessions() { return this.get(STORAGE_KEYS.SESSIONS) || []; }
  saveCompletedSession(session) {
    const sessions = this.getSessions();
    sessions.unshift(session); // Añadir al inicio
    return this.set(STORAGE_KEYS.SESSIONS, sessions);
  }

  getActiveWorkout() { return this.get(STORAGE_KEYS.ACTIVE_WORKOUT); }
  saveActiveWorkout(workout) { return this.set(STORAGE_KEYS.ACTIVE_WORKOUT, workout); }
  clearActiveWorkout() { localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT); }

  getNutritionLog(dateFilter) {
    const logs = this.get(STORAGE_KEYS.NUTRITION_LOG) || [];
    if (dateFilter) return logs.filter(l => l.date === dateFilter);
    return logs;
  }
  addNutritionItem(item) {
    const logs = this.get(STORAGE_KEYS.NUTRITION_LOG) || [];
    logs.push(item);
    return this.set(STORAGE_KEYS.NUTRITION_LOG, logs);
  }

  getEvolutionLog() { return this.get(STORAGE_KEYS.EVOLUTION_LOG) || []; }
  addEvolutionEntry(entry) {
    const logs = this.getEvolutionLog();
    logs.push(entry);
    logs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return this.set(STORAGE_KEYS.EVOLUTION_LOG, logs);
  }
  deleteEvolutionEntry(id) {
    const logs = this.getEvolutionLog().filter(e => e.id !== id);
    return this.set(STORAGE_KEYS.EVOLUTION_LOG, logs);
  }

  getSettings() { return this.get(STORAGE_KEYS.SETTINGS) || {}; }
  saveSettings(settings) { return this.set(STORAGE_KEYS.SETTINGS, settings); }

  // Exportar e importar copia de seguridad completa en JSON
  exportBackup() {
    const dump = {
      exportedAt: new Date().toISOString(),
      appVersion: "1.0.0-fase1",
      profile: this.getProfile(),
      exercises: this.getExercises(),
      routines: this.getRoutines(),
      sessions: this.getSessions(),
      nutritionLog: this.getNutritionLog(),
      evolutionLog: this.getEvolutionLog(),
      settings: this.getSettings()
    };
    return JSON.stringify(dump, null, 2);
  }

  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.set(STORAGE_KEYS.PROFILE, data.profile);
      if (data.exercises) this.set(STORAGE_KEYS.EXERCISES, data.exercises);
      if (data.routines) this.set(STORAGE_KEYS.ROUTINES, data.routines);
      if (data.sessions) this.set(STORAGE_KEYS.SESSIONS, data.sessions);
      if (data.nutritionLog) this.set(STORAGE_KEYS.NUTRITION_LOG, data.nutritionLog);
      if (data.evolutionLog) this.set(STORAGE_KEYS.EVOLUTION_LOG, data.evolutionLog);
      if (data.settings) this.set(STORAGE_KEYS.SETTINGS, data.settings);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  resetAllData() {
    localStorage.clear();
    this.init();
  }
}

// Singleton global
window.AppStore = new StoreManager();
