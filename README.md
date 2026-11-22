# PROYECTO: MI EVOLUCIÓN
## Aplicación Integral de Entrenamiento, Recuperación Física, Hipertrofia y Nutrición con IA

---

### 1. ARQUITECTURA Y DECISIONES TÉCNICAS

Para cumplir rigurosamente el requisito de **coste cero**, **privacidad médica 100% local**, **independencia de suscripciones** y la petición explícita de **visualización inmediata en tu OPPO Find X9 y PC**:

1. **Plataforma y Frontend**:
   - **PWA (Progressive Web App) + Web nativa moderna**: Interfaz responsive táctil optimizada para pantallas AMOLED de alta tasa de refresco (120Hz) como la de tu OPPO Find X9.
   - **Capacitor / APK Ready**: El código fuente está estructurado de forma modular (`index.html`, `/js`, `/css`, `manifest.json`, `sw.js`) para empaquetarse directamente como APK Android nativo con Capacitor (`npx cap add android`) o utilizarse como PWA instalable a pantalla completa sin barra de navegación.

2. **Almacenamiento y Persistencia**:
   - **Local Storage + IndexedDB local**: Todos tus datos personales, historial de dolor lumbar, marcas de fuerza y comidas se guardan en tu dispositivo. Persisten entre sesiones, reinicios y sin conexión a internet.
   - **Exportación e importación**: Copias de seguridad completas en formato JSON estándar descargables con un solo toque desde la pestaña *Perfil y Ajustes*.

3. **Seguridad Clínica y Motor de Progresión**:
   - **Protocolo McGill & McKenzie adaptado**: Detección de sobrecarga lumbar (L2-S1) y limitación de ángulos articulares en empujes para proteger el labrum del hombro derecho (SLAP).
   - **Doble Progresión Inteligente**: Si completas el extremo superior del rango de repeticiones con RIR >= 2 y sin molestias, el sistema propone un aumento moderado (+1 kg o +2.5 kg).
   - **Confirmación Obligatoria**: La IA y las reglas matemáticas **NUNCA** modifican las cargas automáticamente; siempre explican el motivo y solicitan tu aprobación.

4. **Inteligencia Artificial y Coste Cero**:
   - **Modo Offline Determinista**: La aplicación funciona al 100% sin conexión gracias a un motor de inferencia biomecánica y nutricional en JavaScript.
   - **Conector Gemini 1.5 Flash (Gratuito)**: Si deseas respuestas conversacionales más avanzadas, puedes introducir tu clave gratuita de Google AI Studio en *Perfil y Ajustes*. No requiere tarjeta de crédito ni activa facturación.

---

### 2. ACCESO Y SERVIDOR LOCAL

El servidor local ya se encuentra activo sirviendo la aplicación:

- **Desde tu ordenador**:
  Abre tu navegador (Chrome, Edge o Firefox) e ingresa:
  👉 **`http://localhost:8080/`**

- **Desde tu móvil OPPO Find X9 (conectado a la misma red Wi-Fi)**:
  Abre Chrome en tu OPPO Find X9 e ingresa:
  👉 **`http://192.168.1.51:8080/`**

> **💡 Consejo para instalarla como App nativa en tu OPPO Find X9:**
> Al abrir la dirección en Google Chrome en tu móvil, pulsa los 3 puntos superiores del navegador y selecciona **"Añadir a la pantalla de inicio"** (o "Instalar aplicación"). La app se instalará con su propio icono, pantalla completa y acceso a la cámara sin barras de navegador.

---

### 3. FASE 1: ENTRENAMIENTO FUNCIONAL (VERIFICACIÓN)

La FASE 1 ha sido implementada y probada con los siguientes componentes:

1. **Ficha Personal Permanente**:
   - 29 años, 180 cm, 74 kg.
   - Synergym Vega de Acá (Almería).
   - Historial de protrusiones L2-S1, lesión SLAP hombro derecho, codos/tríceps, celiaquía estricta y hernia de hiato.
2. **Biblioteca de Ejercicios en Español**:
   - 20+ ejercicios catalogados por grupo muscular, material, técnica y notas clínicas de seguridad (evitando compresión axial en columna y cuidando el plano escapular a 30° en hombro).
3. **Plantillas Iniciales Editables**:
   - **DÍA A**: Press de pecho en máquina, Remo con pecho apoyado, Zancada estática, Extensión cuádriceps, Curl femoral, Elevaciones laterales, Curl bíceps.
   - **DÍA B**: Press inclinado máquina, Jalón al pecho, Subida a banco bajo, Puente glúteos, Curl femoral, Pájaro máquina, Gemelos, Pallof press.
   - **DÍA C**: Aperturas pecho máquina, Remo con apoyo, Zancada estática, Extensión cuádriceps, Curl femoral, Elevaciones laterales, Curl bíceps, Extensión tríceps.
   - **CORE Y ESPALDA**: Rutina doméstica de 8 min (Heel slides, Puente glúteos, Bird-dog, Esfinge lumbar McKenzie suave, Estiramiento psoas).
4. **Pantalla de Entrenamiento en Directo (Live Workout)**:
   - Cronómetro de sesión en tiempo real.
   - Tabla de series con pesos y repeticiones del entreno anterior visibles.
   - Checkbox gigante táctil de **1 toque** para completar series (diseñado para usar con una mano en el gimnasio).
   - Temporizador de descanso automático con cuenta atrás y avisos sonoros (Web Audio sintetizado offline).
   - Preguntas rápidas no intrusivas: RIR (repeticiones en recámara) y registro de molestias articulares (lumbar, hombro, codo).
   - Botón de **Deshacer** por si se pulsa una serie por error.
   - **Auto-guardado permanente**: si sales de la app o se apaga el móvil, la sesión se recupera intacta.
5. **Finalización y Progresión**:
   - Resumen de volumen total (kg movilizados), duración y series efectivas.
   - Análisis de progresión con propuestas transparentes y botones de [Aceptar] o [Mantener].
   - Cuestionario de fatiga y dolor post-entreno.

---

### 4. ESTRUCTURA DE ARCHIVOS

```
mi-evolucion-app/
├── index.html            # Interfaz principal (PWA)
├── manifest.json         # Manifiesto de instalación Android
├── sw.js                 # Service worker para caché 100% offline
├── server.ps1            # Servidor local HTTP en PowerShell
├── icon.svg              # Icono vectorial deportivo
├── css/
│   └── app.css           # Estilos oscuros de alto contraste y variables CSS
├── js/
│   ├── store.js          # Base de datos local (localStorage / IndexedDB) y exportación JSON
│   ├── rules.js          # Motor biomecánico, banderas rojas y doble progresión
│   ├── workout.js        # Motor de sesión en vivo, temporizador de descanso y audio beeps
│   ├── nutrition.js      # Cálculo de macros (1.9g/kg prot), registro de comidas y celiaquía
│   ├── ai_coach.js       # Asistente IA contextual fundamentado en la base de datos
│   └── app.js            # Coordinador de vistas y modales
└── README.md             # Esta documentación
```
