/**
 * MI EVOLUCIÓN - Módulo de Nutrición Inteligente y Registro Fotográfico
 * Adaptado a enfermedad celíaca, intolerancia a lactosa, hernia de hiato y horarios reales.
 */

class NutritionManager {
  constructor() {
    this.currentPendingMeal = null;
  }

  // Catálogo base de alimentos frecuentes en España adaptados al usuario
  getCommonSpanishFoods() {
    return [
      { name: "Pechuga de pollo a la plancha", unit: "100g", cal: 165, prot: 31, carbs: 0, fat: 3.6, glutenFree: true, lactoseFree: true },
      { name: "Lomo embuchado de bellota", unit: "50g", cal: 135, prot: 19, carbs: 0.5, fat: 6, glutenFree: true, lactoseFree: true, note: "Excelente cena alta en proteína sin cocinar" },
      { name: "Arroz blanco cocido", unit: "100g", cal: 130, prot: 2.7, carbs: 28, fat: 0.3, glutenFree: true, lactoseFree: true },
      { name: "Huevos enteros a la plancha/cocidos", unit: "2 unidades (M/L)", cal: 140, prot: 12.6, carbs: 0.7, fat: 9.8, glutenFree: true, lactoseFree: true },
      { name: "Pan sin gluten (rebanada/tostada)", unit: "50g", cal: 125, prot: 1.8, carbs: 26, fat: 1.2, glutenFree: true, lactoseFree: true, warning: "Verificar sello espiga barrada" },
      { name: "Queso semicurado sin lactosa", unit: "40g", cal: 155, prot: 10, carbs: 0.5, fat: 12.5, glutenFree: true, lactoseFree: true },
      { name: "Jamón serrano / ibérico", unit: "50g", cal: 120, prot: 15, carbs: 0, fat: 6.5, glutenFree: true, lactoseFree: true },
      { name: "Atún al natural en lata", unit: "1 lata (80g neto)", cal: 85, prot: 19, carbs: 0, fat: 0.8, glutenFree: true, lactoseFree: true },
      { name: "Nueces / Almendras naturales", unit: "30g", cal: 185, prot: 6, carbs: 4, fat: 18, glutenFree: true, lactoseFree: true },
      { name: "Aceite de oliva virgen extra", unit: "1 cucharada (10g)", cal: 88, prot: 0, carbs: 0, fat: 10, glutenFree: true, lactoseFree: true }
    ];
  }

  // Resumen nutricional del día
  getDailySummary(dateString) {
    const today = dateString || new Date().toISOString().split('T')[0];
    const meals = window.AppStore.getNutritionLog(today);
    const profile = window.AppStore.getProfile();
    const targets = profile.nutritionTargets || { dailyCalories: 2250, proteinGrams: 140, carbsGrams: 260, fatGrams: 65 };

    let consumedCal = 0;
    let consumedProt = 0;
    let consumedCarbs = 0;
    let consumedFat = 0;

    meals.forEach(m => {
      consumedCal += m.estimatedCalories || 0;
      consumedProt += m.protein || 0;
      consumedCarbs += m.carbs || 0;
      consumedFat += m.fat || 0;
    });

    return {
      date: today,
      meals: meals,
      calories: { consumed: Math.round(consumedCal), target: targets.dailyCalories, remaining: Math.max(0, targets.dailyCalories - Math.round(consumedCal)) },
      protein: { consumed: Math.round(consumedProt), target: targets.proteinGrams, remaining: Math.max(0, targets.proteinGrams - Math.round(consumedProt)) },
      carbs: { consumed: Math.round(consumedCarbs), target: targets.carbsGrams, remaining: Math.max(0, targets.carbsGrams - Math.round(consumedCarbs)) },
      fat: { consumed: Math.round(consumedFat), target: targets.fatGrams, remaining: Math.max(0, targets.fatGrams - Math.round(consumedFat)) }
    };
  }

  // Helper para comprimir y convertir archivo de imagen a Base64 (evita fallos con fotos grandes de móvil)
  fileToBase64(file, maxDimension = 1280) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({
            base64: compressedDataUrl.split(',')[1],
            mimeType: 'image/jpeg',
            previewUrl: compressedDataUrl
          });
        };
        img.onerror = () => {
          resolve({
            base64: dataUrl.split(',')[1],
            mimeType: file.type || 'image/jpeg',
            previewUrl: dataUrl
          });
        };
        img.src = dataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Análisis fotográfico mediante IA multimodal (Gemini Vision API real o motor local)
  async analyzeMealPhoto(file, promptComment) {
    const settings = window.AppStore.getSettings();
    const apiKey = settings && settings.geminiApiKey ? settings.geminiApiKey.trim() : null;
    let imageData = null;
    let fallbackReason = null;

    try {
      imageData = await this.fileToBase64(file);
    } catch (e) {
      console.warn("No se pudo leer la imagen:", e);
    }

    // Si el usuario ha configurado su clave gratuita de Google AI Studio, usar Gemini Vision real
    if (apiKey && imageData) {
      const systemPrompt = `
        Eres un nutricionista deportivo especializado en deportistas con patologías digestivas.
        El usuario tiene: CELIAQUÍA ESTRICTA (alerta máxima de gluten o contaminación cruzada), INTOLERANCIA A LA LACTOSA y HERNIA DE HIATO.
        Analiza la fotografía del plato de comida. Identifica los ingredientes visibles, estima cantidades realistas en gramos y calcula calorías, proteínas, hidratos y grasas.
        Debes responder OBLIGATORIAMENTE en formato JSON puro (sin markdown ni texto extra) según este esquema exacto:
        {
          "dishName": "Nombre descriptivo del plato en español",
          "confidenceLevel": "Alta / Media / Baja con % estimado",
          "uncertaintyDisclaimer": "Aviso de incertidumbre (ej: cantidad de aceite no visible o peso exacto)",
          "celiacAlert": "Advertencia específica sobre posible gluten, caldos preparados o contaminación en este tipo de plato",
          "items": [
            {
              "name": "Nombre del ingrediente",
              "estimatedPortion": "Porción aproximada (ej: 180g)",
              "calories": 250,
              "protein": 35,
              "carbs": 0,
              "fat": 5
            }
          ],
          "totalCalories": 650,
          "totalProtein": 45,
          "totalCarbs": 60,
          "totalFat": 18
        }
        Aclaraciones adicionales del usuario: "${promptComment || 'Ninguna'}".
      `;

      try {
        const { model, data } = await window.GeminiHelper.generateContent(apiKey, {
          contents: [
            {
              parts: [
                { text: systemPrompt },
                {
                  inline_data: {
                    mime_type: imageData.mimeType,
                    data: imageData.base64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.2
          }
        });

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          const parsed = JSON.parse(cleaned);
          parsed.items = Array.isArray(parsed.items) ? parsed.items : [];
          parsed.source = 'gemini';
          parsed.modelUsed = model;
          parsed.photoPreview = imageData.previewUrl;
          this.currentPendingMeal = parsed;
          return parsed;
        }
        fallbackReason = `${model}: respuesta vacía`;
      } catch (err) {
        fallbackReason = err.message || 'Error de conexión con Gemini Vision';
        console.warn("Error conectando con Gemini Vision:", err);
      }
    } else if (!apiKey) {
      fallbackReason = 'No hay clave API de Gemini configurada en la pestaña Perfil.';
    }

    // Motor local de respaldo cuando no hay clave o falla la conexión
    return new Promise((resolve) => {
      setTimeout(() => {
        const isBreakfast = promptComment && promptComment.toLowerCase().includes("tostada");
        
        let result = null;
        if (isBreakfast) {
          result = {
            dishName: "Media tostada en bar con tomate y jamón",
            confidenceLevel: "Simulado (sin IA)",
            uncertaintyDisclaimer: "Valores aproximados. En hostelería el aceite y el espesor del pan pueden variar sensiblemente.",
            celiacAlert: "ADVERTENCIA CELIAQUÍA: Exigir tostadora exclusiva o bolsa de tostado para evitar contaminación cruzada con migas de pan con gluten.",
            items: [
              { name: "Pan sin gluten tostado", estimatedPortion: "60g (media pieza)", calories: 155, protein: 2.2, carbs: 32, fat: 1.5, editable: true },
              { name: "Jamón curado loncheado", estimatedPortion: "40g", calories: 95, protein: 12.5, carbs: 0, fat: 4.8, editable: true },
              { name: "Tomate natural triturado", estimatedPortion: "30g", calories: 6, protein: 0.3, carbs: 1.2, fat: 0.1, editable: true },
              { name: "Aceite de oliva virgen extra", estimatedPortion: "1 chorrito (~8g)", calories: 70, protein: 0, carbs: 0, fat: 8, editable: true }
            ],
            totalCalories: 326,
            totalProtein: 15,
            totalCarbs: 33,
            totalFat: 14
          };
        } else {
          result = {
            dishName: "Plato casero de Arroz con Pollo y guarnición",
            confidenceLevel: "Simulado (sin IA)",
            uncertaintyDisclaimer: "Los gramos de carne y aceite se estiman por volumen visual. Corrige las cantidades si pesaste los alimentos.",
            celiacAlert: "Atención: Si se usaron caldos preparados, pastillas de caldo o salsas caseras, verificar que estén certificadas sin gluten.",
            items: [
              { name: "Pechuga de pollo a la plancha", estimatedPortion: "170g", calories: 275, protein: 42, carbs: 0, fat: 5.5, editable: true },
              { name: "Arroz blanco cocido", estimatedPortion: "200g (1 plato hondo medio)", calories: 260, protein: 5.4, carbs: 56, fat: 0.6, editable: true },
              { name: "Aceite de oliva en preparación", estimatedPortion: "10g", calories: 88, protein: 0, carbs: 0, fat: 10, editable: true }
            ],
            totalCalories: 623,
            totalProtein: 47,
            totalCarbs: 56,
            totalFat: 16
          };
        }

        // Si el usuario añadió aclaraciones textuales
        if (promptComment) {
          if (promptComment.toLowerCase().includes("aceite")) {
            result.items.push({ name: "Aceite extra añadido", estimatedPortion: "+10g", calories: 88, protein: 0, carbs: 0, fat: 10, editable: true });
            result.totalCalories += 88;
            result.totalFat += 10;
          }
          if (promptComment.toLowerCase().includes("huevo")) {
            result.items.push({ name: "Huevo extra", estimatedPortion: "1 unidad (60g)", calories: 75, protein: 6.5, carbs: 0.4, fat: 5.2, editable: true });
            result.totalCalories += 75;
            result.totalProtein += 6.5;
            result.totalFat += 5.2;
          }
        }

        result.source = apiKey ? 'fallback' : 'local';
        result.fallbackReason = fallbackReason;
        result.photoPreview = imageData ? imageData.previewUrl : null;
        this.currentPendingMeal = result;
        resolve(result);
      }, 600);
    });
  }

  // Guardar comida confirmada en el registro
  confirmMeal(mealData) {
    const newEntry = {
      id: "meal_" + Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      name: mealData.dishName || "Comida registrada",
      mealType: mealData.mealType || "comida",
      estimatedCalories: Math.round(mealData.totalCalories || 0),
      protein: Math.round(mealData.totalProtein || 0),
      carbs: Math.round(mealData.totalCarbs || 0),
      fat: Math.round(mealData.totalFat || 0),
      items: mealData.items || [],
      photoUrl: mealData.photoUrl || null,
      notes: mealData.notes || "",
      confirmed: true
    };

    window.AppStore.addNutritionItem(newEntry);
    return newEntry;
  }
}

window.NutritionEngine = new NutritionManager();
