# Typos en los archivos TXT — para el autor del contenido

Estos errores están en los archivos TXT fuente bajo `docs/nuevos/`. NO afectan el JSON (la app usa la versión corregida en el JSON), pero conviene actualizarlos para futuras ediciones.

Generado: 2026-05-13

---

## FR — debutante (`ejercicios FRANCES DEBUTANTE.txt`)

- **Ej 9, Respuesta 2 (línea 206):** `"chosie"` → debería ser `"choisie"` (participio pasado femenino de *choisir*). El JSON ya tiene la forma correcta.
- **Ej 7, Respuesta 5 (línea 156):** `"tu as vomi, ta maman pris"` — falta el auxiliar `"a"`. Debería ser `"ta maman a pris"`. El JSON lo maneja correctamente como huecos separados.
- **Codificación (general):** El archivo TXT presenta mojibake (caracteres acentuados corruptos: à, é, ô, etc.) en algunas líneas. El JSON renderiza correctamente.

---

## FR — control debutante (`ejercicios FRANCES control debutante.txt`)

- **Ej 3, ítem 7:** La oración `"Que de rumeurs elle (propager) sans cesse !"` no lleva el marcador de hueco `______________` antes del paréntesis del verbo. El resto de ítems sí lo llevan. La clave de respuesta muestra `"a propagées"` correctamente; el JSON usa `{{0}}` en el lugar correcto.
- **Codificación (general):** Algunos artefactos de codificación de acentos visibles en lectura cruda. El JSON está correctamente en UTF-8.

---

## FR — intermedio (`ejercicios FRANCES INTERMEDIO.txt`)

- **Línea 95:** `"REspuesta 5"` — capitalización inconsistente (la mayúscula en medio de la palabra). Cosmético.
- **Codificación (general):** Corrupción UTF-8 en varias líneas (caracteres acentuados como é, è, à se muestran mal). El JSON renderiza correctamente.

---

## FR — control intermedio (`ejercicios FRANCES control intermedio.txt`)

- **Línea 52:** `***Poner ejemplo` — marcador en **español** dentro de un archivo de ejercicios en **francés**. Debería ser `***Donner un exemple` o equivalente en francés.
- **Ej 4, marcador (línea 72):** El marcador dice `***Completar` pero el ejercicio es de opción múltiple (*choix multiple*). Debería ser `***Elegir` o `***Choisir`. El JSON corrige esto con `kind: "choice"`.
- **Codificación (general):** Degradación de acentos en lectura cruda (é→e). El JSON está codificado correctamente en UTF-8.

---

## FR — superior (`ejercicios FRANCES SUPERIOR.txt`)

- **Línea 60 (Ej 3, Respuesta):** `"Les devoirs, je les ai fait corrig"` — acento final faltante o garbled. Debería terminar en `"corrigé"` (participio de *corriger*). Posible causa: problema de codificación UTF-8 o copiar/pegar desde Word/PDF.
- **Línea 221 (Ej 11, marcador):** `***Elegir si es posible o no` — instrucción en **español** en archivo de ejercicios en **francés**. El título del ejercicio está correctamente en francés en el JSON.

---

## FR — control superior (`ejercicios FRANCES control superior.txt`)

- **Ej 3, ítem 4 (Respuesta):** `"eûtes"` presenta artefacto de codificación de acento (UTF-8 mal guardado). El JSON tiene la forma canónica correcta.
- **Codificación (general):** Inconsistencias de diacríticos visibles en lectura cruda del TXT. El JSON está correctamente en UTF-8.

---

## IT — debutante (`ejercios ITALIANO DEBUTANTE.txt`)

> Nota: el nombre del archivo tiene un typo — `"ejercios"` en lugar de `"ejercicios"`.

- **Ej 1, línea 52:** `"tolgliere"` → debería ser `"togliere"`. El JSON tiene la forma correcta.
- **Ej 4, línea 61:** `"uccire"` → debería ser `"uccidere"`. El JSON tiene la forma correcta.
- **Ej 11, Respuesta (línea 379):** `"ragaze sonoandate"` — dos errores: (1) `"ragaze"` → `"ragazze"`, (2) `"sonoandate"` → `"sono andate"` (falta espacio). El JSON estructura el ejercicio correctamente como `["Le", "ragazze", "sono", "andate", "al", "mare"]`.
- **Codificación (líneas 81–107):** Codificación UTF-8 mixta con representaciones no estándar de é/è. No propagado al JSON (UTF-8 limpio).

---

## IT — control debutante (`ejercicios ITALIANO control debutante .txt`)

> Nota: el nombre del archivo tiene un espacio extra antes del `.txt`.

- **Línea 2:** `***Elegir` aparece en el título del ejercicio (debería ser solo un marcador de tipo, no en el título).
- **Línea 3:** `(__abbiamo capito__siamo capito__siamo capiti)` — formato de triple guión bajo no estándar. Las otras opciones usan doble guión bajo.
- **Línea 36:** `"anadre"` → debería ser `"andare"`. El JSON corrige esto.
- **Línea 48:** `"anadre"` → debería ser `"andare"` (segunda ocurrencia). El JSON corrige esto.
- **Línea 59:** `"centra"` → debería ser `"centro"`. El JSON corrige esto.
- **Línea 70:** `"machina"` → debería ser `"macchina"` (doble c). El JSON corrige esto.
- **Línea 70:** `"piecevole"` → debería ser `"piacevole"`. El JSON corrige esto.
- **Línea 73:** `"strato"` en la clave de respuesta → debería ser `"stato"`. **El JSON preserva el error** — revisar si debe corregirse también en el JSON.
- **Línea 75:** `"dimentirare"` → debería ser `"dimenticare"`. El JSON corrige esto.
- **Codificación (líneas 6, 48):** `"così"` → `"cos?"` y `"perché"` → `"??rch?"` — caracteres corruptos en el TXT fuente. El JSON tiene UTF-8 correcto.
- **Ej 1, ítem i (semántico):** La oración usa `"ho risposto"` (primera persona) pero el sujeto es tercera persona `"lui"`. Debería ser `"ha risposto"`. El JSON debe corregirse también (ver nota crítica abajo).

> **NOTA CRÍTICA:** El ítem i de Ej 1 tiene un error de concordancia sujeto-verbo que sí afecta el aprendizaje. Confirmar si la intención pedagógica es detectar el error o si es un typo involuntario.

---

## IT — intermedio (`ejercicios ITALIANO INTERMEDIO.txt`)

- **Línea 16 (Ej 1, ítem k):** `"...tutto così un mese fa_________________ ricominciare..."` — pensamiento incompleto o truncado en ambas fuentes (TXT y JSON). Posible pérdida de datos en la transcripción.
- **Línea 93:** `"l'??r???li"` — corrupción de codificación (encoding corruption). El JSON lo corrige a `"l'Acropoli"`.
- **Línea 119:** `";arimo"` — probable artefacto de OCR o transcripción. El JSON lo corrige a `"Marino"`.
- **Línea 147:** `"drovranno ricoverate"` → debería ser `"dovranno ricoverare"` (error de verbo + género). El JSON corrige esto.
- **Línea 203:** `"???"` — placeholder sin resolver. El JSON infiere `"ero"` a partir de la Respuesta 9.
- **Línea 267:** `"si hanno trasferito"` → debería ser `"si sono trasferiti"` (auxiliar incorrecto). El JSON corrige esto.
- **Línea 292:** `***Arrastar y Ordenar las palabras` — marcador en **español** dentro de un archivo de ejercicios en **italiano**. Debería ser `***Ordinare le parole` o similar.
- **Línea 240–241 / 253 / 275:** Caracteres `"???"` (corrupción de codificación) en bloques de Respuesta. El JSON los resuelve correctamente.
- **13 errores adicionales de acento/espaciado/typo (baja gravedad):**
  - `"puo pi"` → `"può più"`
  - `"justi"` → `"giusti"`
  - `"dom ande"` → `"domande"`
  - `"farem o"` → `"faremo"`
  - `"showrrmi"` → `"mostrarmi"`
  - `"accesso"` → `"acceso"`
  - `"Respusta"` → `"Risposta"`
  - `"cossi"` → `"così"`
  - `"rimasto"` → `"rimasti"`
  - Otros artefactos de espaciado en palabras divididas

---

## IT — control intermedio (`ejercicios ITALIANO control intermedio.txt`)

- **Ej 4, ítem 2 (línea 80):** `"saranno publicati"` → debería ser `"saranno pubblicati"` (doble c en italiano). El JSON tiene ambas formas aceptadas: `["saranno pubblicati", "verranno pubblicati"]`.
- **Ej 4, ítem 5 (línea 83):** `"è stata construita"` → debería ser `"è stata costruita"` (falta la primera t). El JSON tiene la forma correcta.
- **Línea 66 (Ej 3, ítem 9):** `"Voi non eravate ancora nati  io andavo gi"` — frase truncada. Falta `"quando"` antes de la cláusula principal y parece cortada. Posible error de OCR o transcripción.

---

## IT — superior (`ejercicios ITALIANO INTERMEDIO.txt`)

- **Línea 152, Ej 7:** `***Elegeir` → debería ser `***Elegir` (error ortográfico en el marcador en español).
- **Línea 264, Ej 11:** `"Columna a con Columna b"` → debería ser `"Colonna A con Colonna B"` (encabezados en **español** dentro de archivo en **italiano**).
- **Línea 149 (Respuesta 6o):** `"abbia fatto;a superare"` — punto y coma extra. Debería ser `"abbia fatto a superare"`.
- **Líneas 240–241, 253 (Respuesta 10b, 11j):** Caracteres `"???"` — corrupción de codificación. El JSON restaura las formas correctas.
- **Línea 317 (Ej 12h):** Texto errante o malformado adjunto a la descripción del ítem; continúa en el siguiente ítem.

---

## IT — control superior (`ejercicios ITALIANO control superior.txt`)

- **Línea 71 (Respuesta):** `"non abbia sentito sentito"` — palabra duplicada. Debería ser `"non abbia sentito"`. El JSON tiene la forma correcta.
- **Línea 72 (Respuesta):** `"siano abituati a questo uso svagliato"` → `"svagliato"` debería ser `"sbagliato"`. El JSON tiene la forma correcta.
- **Línea 75 (Respuesta):** `"Daniela pens ache"` — espacio incorrecto en medio de la palabra. Debería ser `"Daniela pensa che"`. El JSON tiene la forma correcta.
- **Línea 69 (Respuesta):** `"gli student"` — truncado. Debería ser `"gli studenti"`. El JSON tiene la forma correcta.

---

## Sumario

| Categoría | Count |
|-----------|-------|
| Total typos / issues | 52 |
| Críticos (error semántico o de concordancia que afectaría el aprendizaje si se propagara al JSON) | 3 |
| Errores de codificación (diacríticos garbled, encoding artifacts) | 14 |
| Marcadores en español dentro de archivos de otro idioma | 5 |
| Typos ortográficos puros (letras invertidas, faltantes) | 18 |
| Formato / truncado / texto incompleto | 7 |
| Duplicados / espaciado incorrecto | 5 |

### Los 3 errores críticos (que podrían afectar el aprendizaje si se propagaran al JSON)

1. **IT control debutante, Ej 1 ítem i:** `"ho risposto"` (1ª persona) con sujeto `"lui"` (3ª persona) — concordancia sujeto-verbo rota. El JSON debe verificar si usa `"ha risposto"`.
2. **IT control debutante, línea 73:** `"strato"` → `"stato"` — el JSON conserva este error; confirmar si debe corregirse.
3. **IT intermedio, línea 16 (Ej 1, ítem k):** Frase incompleta en ambas fuentes (TXT y JSON) — posible pérdida de contenido pedagógico.

### Archivos TXT con mayor densidad de errores (de mayor a menor)

1. `ejercicios ITALIANO control debutante .txt` — 10+ issues
2. `ejercicios ITALIANO INTERMEDIO.txt` — 19+ issues (encoding + typos)
3. `ejercicios FRANCES SUPERIOR.txt` — 2 issues (1 encoding, 1 Spanish marker)
4. `ejercicios FRANCES DEBUTANTE.txt` — 3 issues (typos + encoding)
5. Resto — 1–3 issues cada uno
