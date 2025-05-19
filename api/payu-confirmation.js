const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuración del transportador de correo con Zoho
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true, // true para 465, false para otros puertos
  auth: {
    user: 'info@jolmandeveloper.com',
    pass: process.env.ZOHO_PASSWORD // Asegúrate de configurar esta variable en Vercel
  }
});

function allowCors(handler) {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    return handler(req, res);
  };
}

// Función para formatear la fecha
function formatDate(date) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'America/Bogota'
  }).format(date);
}

// Función para formatear el valor en COP
function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(value);
}

const handler = async (req, res) => {
    console.log('PayU Confirmation Endpoint called!'); // Agrega este log
  console.log('Request body:', req.body); // Agrega este log
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    const {
      reference_sale,
      transaction_id,
      state_pol,
      response_message_pol,
      value,
      currency,
      sign,
      merchant_id,
      reference_pol,
      payment_method_type,
      payment_method_name, // Método de pago específico
      email_buyer,
      payment_date, // Fecha del pago
      payer_name, // Nombre del pagador si está disponible
    } = req.body;

    // Verificar la firma de PayU
    const API_KEY = process.env.PAYU_API_KEY;
    const signatureString = `${API_KEY}~${merchant_id}~${reference_sale}~${value}~${currency}~${state_pol}`;
    const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex');

    if (sign !== expectedSignature) {
      console.error('Invalid PayU signature');
      return res.status(400).send('Invalid signature');
    }

    // Interpretar el estado de la transacción
    let statusMessage;
    let statusColor;
    switch (state_pol) {
      case '4':
        statusMessage = 'APROBADA';
        statusColor = '#28a745'; // Verde
        break;
      case '6':
        statusMessage = 'RECHAZADA';
        statusColor = '#dc3545'; // Rojo
        break;
      case '5':
        statusMessage = 'EXPIRADA';
        statusColor = '#ffc107'; // Amarillo
        break;
      default:
        statusMessage = 'ESTADO DESCONOCIDO';
        statusColor = '#6c757d'; // Gris
    }

    // Enviar correo de notificación
    const mailOptions = {
      from: 'info@jolmandeveloper.com',
      to: 'info@jolmandeveloper.com',
      subject: `Notificación de Pago PayU - ${statusMessage} - Ref: ${reference_sale}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center; padding: 20px 0;">Notificación de Pago PayU</h2>
          
          <div style="background-color: ${statusColor}; color: white; padding: 10px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0;">Estado: ${statusMessage}</h3>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h3 style="color: #333;">Detalles de la Transacción</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong>Referencia:</strong> ${reference_sale}</li>
              <li style="margin: 10px 0;"><strong>ID Transacción:</strong> ${transaction_id}</li>
              <li style="margin: 10px 0;"><strong>Valor:</strong> ${formatCurrency(value)}</li>
              <li style="margin: 10px 0;"><strong>Moneda:</strong> ${currency}</li>
              <li style="margin: 10px 0;"><strong>Método de Pago:</strong> ${payment_method_name || payment_method_type}</li>
              <li style="margin: 10px 0;"><strong>Fecha:</strong> ${formatDate(new Date(payment_date || Date.now()))}</li>
            </ul>

            <h3 style="color: #333; margin-top: 20px;">Información del Comprador</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong>Nombre:</strong> ${payer_name || 'No disponible'}</li>
              <li style="margin: 10px 0;"><strong>Email:</strong> ${email_buyer}</li>
            </ul>

            <h3 style="color: #333; margin-top: 20px;">Detalles Adicionales</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong>Mensaje:</strong> ${response_message_pol}</li>
              <li style="margin: 10px 0;"><strong>Referencia PayU:</strong> ${reference_pol}</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
            Este es un correo automático generado por el sistema de pagos.
          </p>
        </div>
      `
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    // Registrar la notificación
    console.log('PayU Notification processed:', {
      reference_sale,
      transaction_id,
      state_pol,
      statusMessage,
      value,
      currency,
      email_buyer
    });

    // Responder a PayU
    res.status(200).send('OK');

  } catch (error) {
    console.error('Error processing PayU notification:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = allowCors(handler);