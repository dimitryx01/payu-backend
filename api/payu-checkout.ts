import { NextApiRequest, NextApiResponse } from 'next';
const crypto = require('crypto');

// Tipos para TypeScript
interface PayURequestBody {
  nombre: string;
  email: string;
  monto: string;
  comentario?: string;
}

interface PayUResponse {
  action: string;
  fields: {
    merchantId: string;
    accountId: string;
    description: string;
    referenceCode: string;
    amount: string;
    currency: string;
    signature: string;
    buyerEmail: string;
    buyerFullName: string;
    responseUrl: string;
    confirmationUrl: string;
    test?: number;
  };
}

// Configurar CORS para permitir peticiones desde tu dominio
const allowCors = (fn: any) => async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Reemplaza * con tu dominio en producción
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

// Manejador principal de la función
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PayUResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nombre, email, monto, comentario }: PayURequestBody = req.body;

    // Validar datos requeridos
    if (!nombre || !email || !monto) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Configura tus credenciales de PayU (desde variables de entorno)
    const merchantId = process.env.PAYU_MERCHANT_ID!;
    const accountId = process.env.PAYU_ACCOUNT_ID!;
    const apiKey = process.env.PAYU_API_KEY!;
    const isTestMode = process.env.PAYU_TEST_MODE === 'true';

    // Genera un código de referencia único
    const referenceCode = `REF${Date.now()}`;
    const currency = 'USD';
    const amount = parseFloat(monto).toFixed(2);

    // Genera la firma digital
    const signatureString = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
    const signature = crypto.createHash('md5').update(signatureString).digest('hex');

    // Construye la respuesta
    const response: PayUResponse = {
      action: isTestMode 
        ? 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu'
        : 'https://checkout.payulatam.com/ppp-web-gateway-payu',
      fields: {
        merchantId,
        accountId,
        description: comentario || 'Pago de servicios',
        referenceCode,
        amount,
        currency,
        signature,
        buyerEmail: email,
        buyerFullName: nombre,
        responseUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/gracias`,
        confirmationUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payu-confirmation`,
        ...(isTestMode && { test: 1 }),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error processing PayU checkout:', error);
    res.status(500).json({ error: 'Error processing payment request' });
  }
}

// Exportar el manejador con CORS habilitado
export default allowCors(handler);