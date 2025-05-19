const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { IncomingForm } = require('formidable');

// Configuración para desactivar el bodyParser de Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

// Configuración del transportador de correo con Zoho
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: 'info@jolmandeveloper.com',
    pass: process.env.ZOHO_PASSWORD,
  },
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

function formatDate(date) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'America/Bogota',
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  }).format(value);
}

const handler = async (req, res) => {
  console.log('PayU Confirmation Endpoint called!');

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    const data = await new Promise((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields) => {
        if (err) return reject(err);
        resolve(fields);
      });
    });

    console.log('Parsed PayU Body:', data);

    const {
      reference_sale,
      transaction_id,
      state_pol,
      response_message_pol,
      TX_VALUE,
      currency,
      sign,
      merchant_id,
      reference_pol,
      payment_method_type,
      payment_method_name,
      email_buyer,
      payment_date,
      payer_name,
    } = data;

    const API_KEY = process.env.PAYU_API_KEY;

    const signatureString = `${API_KEY}~${merchant_id}~${reference_sale}~${TX_VALUE}~${currency}~${state_pol}`;
    const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex');

    console.log('Firma esperada (cadena):', signatureString);
    console.log('Firma esperada (MD5):', expectedSignature);
    console.log('Firma recibida:', sign);

    if (sign !== expectedSignature) {
      console.error('Firma inválida de PayU');
      return res.status(400).send('Invalid signature');
    }

    let statusMessage;
    let statusColor;
    switch (state_pol) {
      case '4':
        statusMessage = 'APROBADA';
        statusColor = '#28a745';
        break;
      case '6':
        statusMessage = 'RECHAZADA';
        statusColor = '#dc3545';
        break;
      case '5':
        statusMessage = 'EXPIRADA';
        statusColor = '#ffc107';
        break;
      default:
        statusMessage = 'ESTADO DESCONOCIDO';
        statusColor = '#6c757d';
    }

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
              <li><strong>Referencia:</strong> ${reference_sale}</li>
              <li><strong>ID Transacción:</strong> ${transaction_id}</li>
              <li><strong>Valor:</strong> ${formatCurrency(TX_VALUE)}</li>
              <li><strong>Moneda:</strong> ${currency}</li>
              <li><strong>Método de Pago:</strong> ${payment_method_name || payment_method_type}</li>
              <li><strong>Fecha:</strong> ${formatDate(new Date(payment_date || Date.now()))}</li>
            </ul>

            <h3 style="color: #333; margin-top: 20px;">Información del Comprador</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Nombre:</strong> ${payer_name || 'No disponible'}</li>
              <li><strong>Email:</strong> ${email_buyer}</li>
            </ul>

            <h3 style="color: #333; margin-top: 20px;">Detalles Adicionales</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Mensaje:</strong> ${response_message_pol}</li>
              <li><strong>Referencia PayU:</strong> ${reference_pol}</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
            Este es un correo automático generado por el sistema de pagos.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log('PayU Notification processed:', {
      reference_sale,
      transaction_id,
      state_pol,
      statusMessage,
      value,
      currency,
      email_buyer,
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing PayU notification:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = allowCors(handler);