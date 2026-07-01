// Worker de Segulap — recibe el formulario de contacto del sitio y envía el correo vía SMTP2GO.
// Secret requerido: SMTP2GO_API_KEY (npx wrangler secret put SMTP2GO_API_KEY)
// El remitente (FROM) debe estar en un dominio verificado en SMTP2GO.

const RECIPIENT = 'info@segulap.com.ar';
const FROM = 'Segulap Web <web@segulap.com.ar>';

const ALLOWED_ORIGINS = [
  'https://segulap.com.ar',
  'https://www.segulap.com.ar',
  'https://dyf-source.github.io',
  'http://127.0.0.1:8000',
  'http://localhost:8000',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, cors);

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: 'Cuerpo inválido' }, 400, cors);
    }

    // Honeypot: si un bot rellena este campo oculto, fingimos éxito y no enviamos.
    if (data._gotcha) return json({ ok: true }, 200, cors);

    const nombre = (data.nombre || '').trim();
    const email = (data.email || '').trim();
    const asunto = (data.asunto || '').trim();
    const mensaje = (data.mensaje || '').trim();

    if (!nombre || !EMAIL_RE.test(email) || !asunto || !mensaje) {
      return json({ ok: false, error: 'Datos incompletos' }, 422, cors);
    }

    if (!env.SMTP2GO_API_KEY) {
      return json({ ok: false, error: 'Servicio de correo no configurado' }, 503, cors);
    }

    const text = [
      'Nombre:', nombre, '',
      'Email de contacto:', email, '',
      'Asunto:', asunto, '',
      'Mensaje:', mensaje,
    ].join('\n');

    const res = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': env.SMTP2GO_API_KEY,
      },
      body: JSON.stringify({
        sender: FROM,
        to: [RECIPIENT],
        subject: 'Consulta web: ' + asunto,
        text_body: text,
        custom_headers: [{ header: 'Reply-To', value: email }],
      }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result?.data?.succeeded) {
      console.log('SMTP2GO error', res.status, JSON.stringify(result));
      return json({ ok: false, error: 'No se pudo enviar' }, 502, cors);
    }

    return json({ ok: true }, 200, cors);
  },
};

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
