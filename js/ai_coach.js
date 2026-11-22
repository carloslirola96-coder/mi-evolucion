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
        return await this.callGeminiAPI(settings.geminiApiKey, userMessage, ctx);
      } catch (err) {
        console.warn("Fallo en API externa, usando motor determinista local:", err);
      }
    }

    // Motor local determinista de alta calidad basado en reglas y evidencia deportiva
    return this.generateLocalEvidenceBasedResponse(q, ctx);
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
      Eres el Entrenador Personal y Especialista en Readaptación Físico-Clínica de Carlo (29 años, 180cm, 74kg).
      Condiciones médicas: Protrusiones discales L2-S1 (episodio nov 2026, flexión molesta, bipedestación bien), SLAP hombro derecho, codos/tríceps con historial, celíaco estricto, intolerante a lactosa, hernia de hiato. NO recomendar creatina.
      Contexto actual:
      ${JSON.stringify(context)}
      Responde de forma concisa, deportiva, empática, basada en evidencia científica (Schoenfeld, McGill), en español y con máxima seguridad articular.
    `;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nPregunta del usuario: ${prompt}` }] }
        ]
      })
    });

    const data = await res.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error("Respuesta inválida de Gemini API");
  }
}

window.AICoach = new AICoachManager();
