# 💳 PayU Latam Payment Integration (Node.js / Next.js)

Este repositorio contiene una implementación robusta y segura para la integración de la pasarela de pagos **PayU Latam**, diseñada para funcionar como un servicio de backend (API Routes) escalable.

## 🚀 Características Principales

- **Checkout Dinámico:** Generación de firmas criptográficas (MD5) en el servidor para garantizar la integridad de las transacciones.
- **Webhook de Confirmación:** Endpoint especializado para recibir notificaciones de estado en tiempo real (Aprobado, Rechazado, Expirado).
- **Validación de Firmas:** Sistema de verificación de autenticidad para prevenir ataques de "Man-in-the-Middle" y asegurar que las notificaciones provengan exclusivamente de PayU.
- **Notificaciones Automatizadas:** Integración con **Nodemailer** y **Zoho Mail** para el envío de comprobantes detallados por correo electrónico tras cada transacción.
- **Seguridad de Grado de Producción:** Manejo estricto de variables de entorno y políticas de CORS restringidas.

## 🛠️ Stack Tecnológico

- **Runtime:** Node.js
- **Framework:** Next.js (API Routes)
- **Criptografía:** Crypto (Node.js native)
- **Manejo de Formularios:** Formidable
- **Envío de Emails:** Nodemailer
- **Despliegue:** Vercel

## 🔐 Seguridad y Buenas Prácticas

- **Zero-Exposure:** Las llaves maestras (`API_KEY`, `MERCHANT_ID`) se gestionan exclusivamente mediante variables de entorno, nunca expuestas en el cliente ni en el historial de Git.
- **Validación de Datos:** Limpieza y formateo de datos recibidos (redondeo a un decimal según requerimientos de PayU).
- **CORS:** Configuración de cabeceras para permitir peticiones únicamente desde dominios autorizados.

## ⚙️ Configuración Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/dimitryx01/payu-backend.git

2. Instala las dependencias:


npm install


3. Crea un archivo .env basado en el ejemplo:

cp .env.example .env

Configura tus credenciales de PayU y Zoho en el archivo .env.   


📂 Estructura del Proyecto

/api/payu-checkout: Genera el formulario de pago y la firma de seguridad.
/api/payu-confirmation: Recibe y valida la respuesta de la pasarela (Webhook).

Desarrollado por Jolman Gordillo - https://www.linkedin.com/in/jolmang/



# 💳 PayU Latam Payment Integration (Node.js / Next.js)

This repository features a robust and secure implementation for the **PayU Latam** payment gateway integration, designed as a scalable backend service using Next.js API Routes.

## 🚀 Key Features

- **Dynamic Checkout:** Server-side cryptographic signature generation (MD5) to ensure transaction integrity and prevent tampering.
- **Confirmation Webhook:** Specialized endpoint to handle real-time status notifications (Approved, Rejected, Expired).
- **Signature Validation:** Advanced security layer to verify the authenticity of incoming PayU notifications, preventing "Man-in-the-Middle" attacks.
- **Automated Notifications:** Integrated with **Nodemailer** and **Zoho Mail** to send detailed transaction receipts via email upon payment completion.
- **Production-Grade Security:** Strict environment variable management and restricted CORS policies.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Next.js (API Routes)
- **Cryptography:** Crypto (Node.js native)
- **Form Handling:** Formidable
- **Email Service:** Nodemailer
- **Deployment:** Vercel

## 🔐 Security & Best Practices

- **Zero-Exposure Policy:** Sensitive credentials (`API_KEY`, `MERCHANT_ID`) are managed exclusively through environment variables, never exposed to the client-side or Git history.
- **Data Integrity:** Server-side data sanitization and formatting (e.g., rounding transaction values to one decimal place as required by PayU).
- **CORS Protection:** Configured headers to allow requests only from authorized domains.

## ⚙️ Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/payu-backend.git

2. nstall dependencies:

npm install

3. Create a .env file based on the example:

cp .env.example .env

Configure your PayU and Zoho credentials in the .env file.

📂 Project Structure

/api/payu-checkout: Generates the payment form and security signature.
/api/payu-confirmation: Receives and validates the gateway response (Webhook).

Developed by Jolman Gordillo - https://www.linkedin.com/in/jolmang/  