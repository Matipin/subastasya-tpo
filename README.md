# SubastasYa - Aplicación Móvil

Este repositorio contiene el código fuente de **SubastasYa**, una plataforma para participar en subastas dinámicas en tiempo real. 

## 🚀 Cómo ejecutar la aplicación

La arquitectura del proyecto está dividida en un Backend (Java/Spring Boot) y un Frontend (React Native/Expo). **Para facilitar la corrección y prueba, el Backend y la Base de Datos ya se encuentran desplegados y funcionando en la nube** (Render y Supabase). 

Por lo tanto, **solo es necesario ejecutar el Frontend** de manera local para probar la aplicación completa.

### 📋 Requisitos previos
* [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
* Un teléfono móvil con la aplicación **Expo Go** instalada (disponible gratis en [Android/Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) y [iOS/App Store](https://apps.apple.com/us/app/expo-go/id982107779)).

### 📱 Pasos para iniciar el Frontend

1. **Abrir una terminal** y navegar hacia la carpeta del frontend:
   ```bash
   cd subastas-frontend
   ```

2. **Instalar las dependencias** del proyecto:
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo** de Expo:
   ```bash
   npx expo start
   ```

4. **Probar la app en tu dispositivo:**
   * Al ejecutar el comando anterior, aparecerá un **código QR** en la terminal.
   * Abre la aplicación **Expo Go** en tu celular.
   * Selecciona "Scan QR Code" y escanea el código de la terminal.
   * ¡Listo! La aplicación comenzará a construirse e iniciará en tu teléfono conectándose automáticamente al backend en la nube.

---

### ℹ️ Información Adicional
* **Backend Url:** `https://subastasya-tpo.onrender.com/api/v1` (Ya configurado por defecto en la app móvil).

