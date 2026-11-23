/**
 * MI EVOLUCIÓN - Asistente y Entrenador Personal con Inteligencia Artificial
 * Conectado a la base de datos estructurada local y fundamentado en evidencia científica.
 */

class AICoachManager {
  constructor() {
    this.chatHistory = [];
  }

  // Extraer el contexto estructurado relevante sin saturar tokens
  buildStructuredContext() {
    const profile = window.AppStore.getProfile();
    const sessions = window.AppStore.getSessions();
    const nutritionToday = window.NutritionEngine.getDailySummary();
    const evolution = window.AppStore.getEvolutionLog();
    const weeklyVolume = window.ClinicalRules.calculateWeeklyVolume(sessions);

    const lastSession = sessions.length > 0 ? sessions[0] : null;

    return {
      user: {
        name: profile.name,
        age: profile.age,
        weight: profile.weight,
        injuries: profile.medicalHistory,
        targets: profile.nutritionTargets
      },
      todayNutrition: {
        consumedCal: nutritionToday.calories.consumed,
        targetCal: nutritionToday.calories.target,
        consumedProt: nutritionToday.protein.consumed,
        targetProt: nutritionToday.protein.target,
        remainingProt: nutritionToday.protein.remaining
      },
      lastWorkout: lastSession ? {
        routine: lastSession.routineName,
        duration: lastSession.durationMinutes,
        date: lastSession.endTime,
        volumeKg: lastSession.totalVolumeKg
      } : "Aún no hay sesiones registradas",
      weeklyVolume: weeklyVolume
    };
  }

  // Procesar pregunta del usuario
  async askCoach(userMessage) {
    const ctx = this.buildStructuredContext();
    const q = userMessage.toLowerCase().trim();

    // Comprobar si hay API Key configurada para llamar a Gemini directamente
    const settings = window.AppStore.getSettings();
    if (settings.geminiApiKey && settings.geminiApiKey.trim() !== '') {
      try {
        const aiReply = await this.callGeminiAPI(settings.geminiApiKey.trim(), userMessage, ctx);
        return { text: aiReply, source: 'gemini' };
      } catch (err) {
        console.warn("Fallo en API externa, usando motor determinista local:", err);
        return {
          text: this.generateLocalEvidenceBasedResponse(q, ctx),
          source: 'fallback',
          error: err.message
        };
      }
    }

    // Motor local determinista de alta calidad basado en reglas y evidencia deportiva
    return {
      text: this.generateLocalEvidenceBasedResponse(q, ctx),
      source: 'local',
      error: 'Sin API Key configurada en Perfil'
    };
  }

  generateLocalEvidenceBasedResponse(q, ctx) {
    // 1. ¿Qué entreno hoy?
    if (q.includes("qué entreno") || q.includes("que entreno") || q.includes("toca hoy")) {
      return `
        Hoy te recomiendo revisar tus sensaciones lumbares primero:
        - Si han pasado 48h desde tu última sesión de gimnasio: **DÍA A (Pectoral, Espalda y Tren Inferior)** o **DÍA B**.
        - Si hoy estás en casa entre el trabajo de oficina y las oposiciones: Realiza la **Rutina Doméstica de CORE Y ESPALDA (8 minutos)**. Los ejercicios de Bird-Dog y puente de glúteos te ayudarán a descomprimir la tensión de estar sentado.
        - Recuerda: Tienes como regla de seguridad máxima 60 minutos por sesión para no saturar tu recuperación.
      `;
    }

    // 2. Proteínas / Nutrición
    if (q.includes("proteína") || q.includes("proteina") || q.includes("cenar sin cocinar") || q.includes("cena")) {
      const remaining = ctx.todayNutrition.remainingProt;
      return `
        Llevas **${ctx.todayNutrition.consumedProt}g** de proteína hoy de tu objetivo de **${ctx.todayNutrition.targetProt}g** (te faltan aprox. **${remaining}g**).

        💡 **Opciones de cena rápida sin cocinar (100% sin gluten y sin lactosa):**
        1. **Lomo embuchado (80g)**: Aporta unos 30g de proteína de altísima calidad biológica con casi 0 grasa y sin necesidad de encender la sartén.
        2. **2 latas de atún al natural + 40g de queso semicurado sin lactosa**: Unos 45g de proteína rápida.
        3. **Mini bocadillo en pan sin gluten con jamón serrano y un puñado de nueces**: Fácil de digerir antes de dormir para tu hernia de hiato.
      `;
    }

    // 3. Dolor o molestias lumbares / hombro
    if (q.includes("dolor") || q.includes("espalda") || q.includes("molestia") || q.includes("lumbar")) {
      return `
        ⚠ **Protocolo de Readaptación Lumbar (L2-S1):**
        1. **Regla de oro:** No entrenes a través del dolor punzante. Si la molestia supera un 3/10 o irradia a la pierna, frena la carga.
        2. En tu próxima sesión sustituye cualquier ejercicio que genere compresión por ejercicios con apoyo de pecho (como Remo con pecho apoyado).
        3. En casa, túmbate boca abajo 2-3 minutos en posición de esfinge suave solo si alivia o centraliza el dolor.
        4. **Alerta médica:** Si en algún momento notas pérdida de fuerza en los pies o anestesia en la zona perineal, debes acudir a urgencias de inmediato.
      `;
    }

    // 4. Vuelta al pádel
    if (q.includes("pádel") || q.includes("padel") || q.includes("competir")) {
      return `
        Tu vuelta al pádel competitivo está planificada dentro de tu horizonte de 12 meses:
        - **Fase actual:** Restaurar la tolerancia lumbar a la extensión y rotación mediante el ejercicio *Pallof Press* y estabilizadores de cadera (glúteo y cuádriceps unilateral).
        - **Criterio para volver a pista:** Cero dolor en flexión lumbar cotidiana, buena fuerza en zancadas estáticas y haber completado 4 semanas continuadas de gimnasio sin recidivas.
        - Cuando comencemos el peloteo suave, evitaremos remates potentes por encima de la cabeza para proteger también el labrum de tu hombro derecho (SLAP).
      `;
    }

    // 5. Volumen muscular / qué estoy entrenando poco
    if (q.includes("volumen") || q.includes("poco") || q.includes("músculos") || q.includes("musculos")) {
      const vol = ctx.weeklyVolume;
      return `
        📊 **Análisis de tu volumen semanal efectivo:**
        - Pectoral: **${vol["Pectoral"] || 0} series** (Objetivo óptimo: 10-14)
        - Espalda: **${vol["Espalda"] || 0} series** (Objetivo óptimo: 10-14)
        - Hombro lateral/post: **${vol["Hombro (Lateral/Post)"] || 0} series**
        - Cuádriceps: **${vol["Cuádriceps"] || 0} series**
        - Isquios / Glúteos: **${(vol["Isquiotibiales"] || 0) + (vol["Glúteos"] || 0)} series**
        - Core y Estabilidad: **${vol["Core y Estabilidad"] || 0} series**

        💡 *Recomendación:* Priorizamos pecho, hombro y piernas manteniendo las series dentro del umbral de 60 minutos por sesión. No añadas volumen basura si ya estás cerca de la fatiga.
      `;
    }

    // Respuesta general científica
    return `
      Entendido, Carlo. Teniendo en cuenta tus protrusiones discales L2-S1, la lesión SLAP en el hombro derecho y tus objetivos de recomposición corporal (74 kg con meta de hipertrofia y reducción de grasa en cintura):

      - **Entrenamiento:** Priorizamos progresión doble en máquinas guiadas con apoyo de torso para eliminar compresión lumbar.
      - **Nutrición:** Apunta hoy a tus **${ctx.todayNutrition.targetProt}g de proteína** respetando tu dieta estricta para celiaquía y sin lactosa.
      - Si tienes alguna molestia en particular o quieres adaptar una serie específica, dime en qué ejercicio y lo revisamos juntos.
    `;
  }

  async callGeminiAPI(apiKey, prompt, context) {
    const systemPrompt = `
      Eres el Entrenador Personal y Especialista en Readaptación Físico-Clínica de ${context.user.name} (${context.user.age} años, ${context.user.weight}kg).
      Condiciones médicas: Protrusiones discales L2-S1 (episodio nov 2026, flexión molesta, bipedestación bien), SLAP hombro derecho, codos/tríceps con historial, celíaco estricto, intolerante a lactosa, hernia de hiato. NO recomendar creatina.
      Contexto actual:
      ${JSON.stringify(context)}
      Responde de forma concisa, deportiva, empática, basada en evidencia científica (Schoenfeld, McGill), en español y con máxima seguridad articular.
    `;

    const { data } = await window.GeminiHelper.generateContent(apiKey, {
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nPregunta del usuario: ${prompt}` }] }
      ]
    });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
    throw new Error('Respuesta vacía de Gemini API');
  }

  async testConnection(apiKey) {
    if (!apiKey || !apiKey.trim()) {
      return { ok: false, message: 'Introduce primero tu clave API de Google AI Studio.' };
    }
    try {
      window.GeminiHelper.clearCache();
      const { model, data } = await window.GeminiHelper.generateContent(apiKey.trim(), {
        contents: [{ role: 'user', parts: [{ text: 'Responde solo con la palabra: OK' }] }]
      });
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return { ok: true, message: `¡Conexión correcta con ${model}!` };
      }
      return { ok: false, message: 'Respuesta vacía de Gemini.' };
    } catch (err) {
      return { ok: false, message: err.message || 'Error de red al conectar con Gemini' };
    }
  }

  async generateRoutineWithAI({ prompt, category = 'Gimnasio', durationMinutes = 50 }) {
    const settings = window.AppStore.getSettings();
    const apiKey = settings && settings.geminiApiKey ? settings.geminiApiKey.trim() : '';
    if (!apiKey) {
      throw new Error('Configura primero tu clave API de Gemini en la pestaña Perfil.');
    }

    const profile = window.AppStore.getProfile();
    const existingExercises = window.AppStore.getExercises().map(e => ({
      id: e.id,
      name: e.name,
      muscleGroup: e.muscleGroup,
      equipment: e.equipment
    }));

    const systemPrompt = `
      Eres un entrenador personal y especialista en readaptación físico-clínica.
      Diseña UNA rutina de entrenamiento segura y efectiva para ${profile.name} (${profile.age} años, ${profile.weight} kg).
      Historial clínico OBLIGATORIO a respetar:
      ${JSON.stringify(profile.medicalHistory)}

      Petición del usuario: "${prompt}"
      Categoría: "${category}" ("Gimnasio" o "Doméstica")
      Duración objetivo: ${durationMinutes} minutos.

      Biblioteca de ejercicios ya existentes (reutiliza su "exerciseId" exacto cuando encaje, o deja "exerciseId": null si creas uno nuevo):
      ${JSON.stringify(existingExercises)}

      Responde OBLIGATORIAMENTE en JSON puro (sin markdown ni texto adicional) con este esquema exacto:
      {
        "name": "Nombre corto y claro de la rutina",
        "category": "${category}",
        "type": "${category === 'Doméstica' ? 'readaptacion' : 'hipertrofia'}",
        "statusBadge": "Generada con IA",
        "estimatedMinutes": ${durationMinutes},
        "notes": "Resumen breve del enfoque de la sesión y precauciones clave",
        "exercises": [
          {
            "exerciseId": "id_existente_o_null",
            "name": "Nombre del ejercicio",
            "muscleGroup": "Grupo muscular principal",
            "equipment": "Máquina / Mancuernas / Polea / Suelo",
            "notes": "Indicación técnica y de seguridad articular",
            "safetyTag": "Etiqueta corta de seguridad",
            "axialLoad": "Nula / Baja / Moderada",
            "targetSets": 3,
            "targetReps": "10-12",
            "targetWeight": 20,
            "restSeconds": 75
          }
        ]
      }
    `;

    const { model, data } = await window.GeminiHelper.generateContent(apiKey, {
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.4
      }
    });

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Gemini devolvió una respuesta vacía.');

    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
      throw new Error('La rutina generada no contiene ejercicios válidos.');
    }

    parsed.modelUsed = model;
    return parsed;
  }
}

window.GeminiHelper = {
  cachedModel: null,
  cachedKey: null,

  clearCache() {
    this.cachedModel = null;
    this.cachedKey = null;
  },

  async getCandidateModels(apiKey) {
    const defaults = ['gemini-3.8-flash', 'gemini-3.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
    if (this.cachedModel && this.cachedKey === apiKey) {
      return [this.cachedModel, ...defaults.filter(m => m !== this.cachedModel)];
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
      if (res.ok) {
        const json = await res.json();
        const available = (json.models || [])
          .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => (m.name || '').replace(/^models\//, ''))
          .filter(name => /^gemini-.*flash/i.test(name) && !/(tts|audio|image|embedding)/i.test(name));

        if (available.length > 0) {
          // Ordenar priorizando las versiones más recientes y los modelos flash estándar sobre lite/exp
          available.sort((a, b) => {
            const score = (name) => {
              const verMatch = name.match(/gemini-(\d+(?:\.\d+)?)/i);
              const ver = verMatch ? parseFloat(verMatch[1]) : 0;
              const isLite = /lite/i.test(name) ? -0.1 : 0;
              const isPreview = /(preview|exp)/i.test(name) ? -0.05 : 0;
              return ver + isLite + isPreview;
            };
            return score(b) - score(a);
          });
          return [...new Set([...available, ...defaults])];
        }
      }
    } catch (e) {
      console.warn('No se pudo listar modelos de Gemini, usando lista por defecto:', e);
    }

    return defaults;
  },

  async generateContent(apiKey, payload) {
    const models = await this.getCandidateModels(apiKey);
    let lastError = 'No se pudo conectar con Gemini';

    for (const model of models) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        this.cachedModel = model;
        this.cachedKey = apiKey;
        return { model, data };
      }

      const apiMsg = data?.error?.message || `HTTP ${res.status}`;
      lastError = `${model}: ${apiMsg}`;

      // Si el modelo no existe o fue retirado, probar el siguiente modelo disponible
      const isModelRetired = res.status === 404 || /no longer available|not found|deprecated/i.test(apiMsg);
      if (!isModelRetired) {
        throw new Error(lastError);
      }
    }

    throw new Error(lastError);
  }
};

window.AICoach = new AICoachManager();
