# 🎵 Lira Trainer

Aplicación web Angular para aprender a tocar la lira con detección de notas en tiempo real.

## ✨ Características

- **Afinador en tiempo real** — detecta la nota que tocas via micrófono
- **Visualizador de partituras** — renderiza archivos MusicXML
- **Modo práctica** — aprende nota a nota con feedback instantáneo
- **3 partituras incluidas** — Mary Had a Little Lamb, Oda a la Alegría, Twinkle Twinkle

## 🚀 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
ng serve

# 3. Abrir en el navegador
# http://localhost:4200
```

> ⚠️ El micrófono requiere **HTTPS** o **localhost**.

## 🏗️ Build para producción

```bash
ng build
# Salida en: dist/lira-trainer/
```

## 📁 Estructura

Ver `CLAUDE.md` para documentación completa del proyecto.

## 🛠️ Stack

- Angular 17 (Standalone + Signals)
- PrimeNG 17 + PrimeFlex + PrimeIcons
- Pitchy (detección de pitch via MPM)
- OpenSheetMusicDisplay (render de MusicXML)
- Web Audio API

## 📋 Fases de desarrollo

- ✅ **Fase 1** — Afinador en tiempo real
- 🔲 **Fase 2** — Visualizador de partituras (OSMD)
- 🔲 **Fase 3** — Modo práctica completo
- 🔲 **Fase 4** — Pulido y funcionalidades extra
