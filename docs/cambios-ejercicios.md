# Cambios estructurales en ejercicios — checklist de revisión visual

Generado: 2026-05-13
Change SDD: `content-fidelity-audit`

Lista de ejercicios que sufrieron **cambios reales** (no verify-only) tras alinear los JSON con los nuevos TXT source-of-truth. Estos son los que conviene revisar visualmente en el dev server.

---

## 🇫🇷 Francés

### `/fr/basic-control` (ejercicios de control debutante)

| Ej | Qué cambió | Qué mirar |
|---|---|---|
| **2** | Convertido de `choice` a `inline-choice` (12 ítems) | Las oraciones ahora muestran el blank embebido en la frase, no un prompt + lista de opciones aparte |

### `/fr/intermediate` (ejercicios intermedios)

| Ej | Qué cambió | Qué mirar |
|---|---|---|
| **7** | Cambiado de `reorder` (drag-and-drop) a `free-text` (4 ítems) | Ahora el alumno escribe la oración completa en un input box |
| **14** | Cambiado de `reorder` a `free-text` (10 ítems, antes spec decía 6) | Input box para oraciones pasivas |

### `/fr/advanced` (ejercicios superiores)

| Ej | Qué cambió | Qué mirar |
|---|---|---|
| **6** | Ítem 9: notación `"fûtes senti(e)(s)"` → `"fûtes sentis"` | Que acepte la respuesta sin paréntesis raros |
| **7** | **Narrativa restaurada** vía `contextHint` (1101 chars, 4 párrafos del adiós de Marianne) | Card italic con borde izquierdo arriba de los blanks con el texto completo de la historia |
| **9** | **Narrativa restaurada** vía `contextHint` (1743 chars, Roman policier de Christelle Maurin) | Misma card narrativa arriba de los blanks |

---

## 🇮🇹 Italiano

### `/it/basic` (ejercicios debutante)

| Ej | Qué cambió | Qué mirar |
|---|---|---|
| **14** | **Hybrid split**: ahora hay dos entries consecutivas | **14a**: `fill-blank` con "(passo 1/2)" — conjugar el verbo en 10 ítems. **14b**: `match` con "(passo 2/2)" — emparejar sujetos con predicados |

### `/it/basic-control` (ejercicios de control debutante)

| Ej | Qué cambió | Qué mirar |
|---|---|---|
| **1** | Ítem g: añadida variante femenina `"tu non sei voluta"` | Las opciones del inline-choice ahora son 4 en vez de 3 (incluye masculino y femenino visibles) |

### `/it/intermediate` (ejercicios intermedios) — **el más tocado**

| Ej | Qué cambió | Qué mirar |
|---|---|---|
| **3** | **Hybrid split** | **3a**: `fill-blank` "(passo 1/2)" — 4 ítems con `{{0}}` para conjugar al futuro anteriore. **3b**: `match` "(passo 2/2)" — 6 pares |
| **13** | **Hybrid split** | **13a**: `reorder` "(passo 1/2)" — 9 ítems en presente. **13b**: `free-text` "(passo 2/2)" — 9 oraciones al passato (con 1-2 variantes aceptadas cada una) |
| **14** | Migrado de `fill-blank` a `free-text` (6 ítems) | Passive→Active rewriting con accepted variants |
| **15** | Migrado de `fill-blank` a `free-text` (8 ítems) | Active→Passive rewriting con accepted variants |

---

## ✅ Verificación rápida del split en URL

Los ejercicios split mantienen el `number` compartido pero el `id` es distinto. Como `exercise.number` no se renderiza, **la distinción 3a/3b se ve en el título**, no en la URL.

Si la app usa el `id` en la URL (tipo `/it/intermediate/it-intermediate-3a`), deeplinks viejos a `/it/intermediate/it-intermediate-3` ahora rompen. Si usa `number`, dos cards con "3" mostrarán "passo 1/2" y "passo 2/2" para distinguirse.

---

## 📊 Total

**14 ejercicios con cambios estructurales reales:**

- **FR (5)**: basic-control Ej 2; intermediate Ej 7 y 14; advanced Ej 6, 7 y 9
- **IT (9)**: basic Ej 14a y 14b; basic-control Ej 1; intermediate Ej 3a/3b, 13a/13b, 14 y 15

Los otros 7 archivos JSON fueron **verify-only** — el contenido ya estaba alineado con el TXT, no necesitaron edits:

- fr/basic
- fr/intermediate-control
- fr/advanced-control
- it/intermediate-control
- it/advanced
- it/advanced-control

---

## 🔬 Smoke test checklist (14 puntos)

| # | Ruta | Qué confirmar |
|---|---|---|
| 1 | `/` | Solo tabs **FR + IT** (sin Español). Default = FR |
| 2 | `/` | Texto del párrafo es la versión nueva de 2 párrafos |
| 3 | `/fr` y `/it` | Theory y exercise lists cargan sin errores |
| 4 | `/fr/advanced` ex 7 | `contextHint` narrativo en card italic con borde izq arriba de los blanks |
| 5 | `/fr/advanced` ex 9 | Roman policier narrativo arriba |
| 6 | `/fr/intermediate` ex 7 | Es **free-text** (input box), no drag-and-drop |
| 7 | `/fr/intermediate` ex 14 | Es **free-text**, no drag |
| 8 | `/it/basic` ex 14 | **2 entries** consecutivas: 14a (fill-blank "passo 1/2") + 14b (match "passo 2/2") |
| 9 | `/it/intermediate` ex 3 | **2 entries**: 3a + 3b |
| 10 | `/it/intermediate` ex 13 | **2 entries**: 13a (reorder) + 13b (free-text) |
| 11 | View-source `/` | `<html lang="fr">` |
| 12 | View-source `/it/basic` | `<html lang="it">` |
| 13 | View-source cualquier ruta | `<title>` y `<meta description>` bilingües FR+IT (no español) |
| 14 | Console del browser | Sin errores rojos |
