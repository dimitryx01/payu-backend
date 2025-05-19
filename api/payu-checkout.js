const crypto = require('crypto');

function generateReferenceCode() {
  // Genera un código único combinando timestamp y números aleatorios
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `REF_${timestamp}_${random}`;
}

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

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    const {
      nombre,
      email,
      monto,
      comentario
    } = req.body;

    const referenceCode = generateReferenceCode();
    const description = comentario || `Pago de ${nombre}`;
    const amount = parseFloat(monto).toFixed(2);

    const MERCHANT_ID = process.env.PAYU_MERCHANT_ID;
    const ACCOUNT_ID = process.env.PAYU_ACCOUNT_ID;
    const API_KEY = process.env.PAYU_API_KEY;
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
    const TEST_MODE = process.env.PAYU_TEST_MODE === 'true';

    const signatureString = `${API_KEY}~${MERCHANT_ID}~${referenceCode}~${amount}~COP`;
    const signature = crypto.createHash('md5').update(signatureString).digest('hex');

    const form = `
     <form id="payuForm" method="post" action="https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/">
        <input name="merchantId"    type="hidden"  value="${MERCHANT_ID}"   >
        <input name="accountId"     type="hidden"  value="${ACCOUNT_ID}" >
        <input name="description"   type="hidden"  value="${description}"  >
        <input name="referenceCode" type="hidden"  value="${referenceCode}" >
        <input name="amount"        type="hidden"  value="${amount}"   >
        <input name="tax"           type="hidden"  value="0"  >
        <input name="taxReturnBase" type="hidden"  value="0" >
        <input name="currency"      type="hidden"  value="COP" >
        <input name="signature"     type="hidden"  value="${signature}"  >
        <input name="test"          type="hidden"  value="${TEST_MODE ? 1 : 0}" >
        <input name="buyerEmail"    type="hidden"  value="${email}" >
        <input name="responseUrl"    type="hidden"  value="${process.env.PAYU_RESPONSE_URL}" >
        <input name="confirmationUrl" type="hidden" value="${process.env.PAYU_CONFIRMATION_URL}" >
        <input name="buyerFullName" type="hidden"  value="${nombre}" >
      </form>
      <script>
        document.getElementById("payuForm").submit();
      </script>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(form);
  } catch (error) {
    console.error('Error in payu-checkout:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = allowCors(handler);