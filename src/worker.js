const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/send-email') {
      if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
      return handleEmail(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleEmail(request, env) {
  try {
    const {
      nome = '', email = '', condominio = '', cep = '',
      apartamentos = '', telefone = '', dor = '',
      imagem_condominio_url = '',
    } = await request.json();

    const firstName = nome.split(' ')[0] || nome;
    const KEY = env.RESEND_API_KEY;

    const send = (from, to, subject, html) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, html }),
      });

    const adminHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
<tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 40px;text-align:center">
  <p style="margin:0;color:#e9d5ff;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Nova Lead · Zelaria Beta</p>
  <h1 style="margin:8px 0 0;color:#fff;font-size:26px;font-weight:800">🏢 ${condominio || '—'}</h1>
  <p style="margin:6px 0 0;color:#ddd6fe;font-size:14px">${nome}</p>
</td></tr>
<tr><td style="padding:32px 40px">
  <table width="100%" cellpadding="0" cellspacing="0">
    ${row('👤 Nome', nome)}${row('🏢 Condomínio', condominio)}${row('📍 CEP', cep)}
    ${row('🏠 Apartamentos', apartamentos)}${row('📱 Telefone', telefone)}${row('✉️ E-mail', email)}
  </table>
  <div style="margin-top:24px;background:#faf5ff;border-left:4px solid #a855f7;border-radius:0 8px 8px 0;padding:16px 20px">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7c3aed">Maior Dor Operacional</p>
    <p style="margin:0;font-size:14px;color:#1e1b4b;line-height:1.6">${dor || '—'}</p>
  </div>
  ${imagem_condominio_url ? `<div style="margin-top:24px;text-align:center">
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b">Foto da Fachada</p>
    <a href="${imagem_condominio_url}" target="_blank">
      <img src="${imagem_condominio_url}" alt="Fachada" style="max-width:100%;border-radius:12px;border:1px solid #e2e8f0"/>
    </a></div>` : ''}
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center">
  <p style="margin:0;font-size:12px;color:#94a3b8">Zelaria · Inteligência Condominial com IA</p>
</td></tr>
</table></td></tr></table></body></html>`;

    const leadHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
<tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:40px 40px 32px;text-align:center">
  <p style="margin:0;font-size:32px">✨</p>
  <h1 style="margin:12px 0 0;color:#fff;font-size:26px;font-weight:800">Maravilha, ${firstName}!</h1>
  <p style="margin:10px 0 0;color:#ddd6fe;font-size:15px;line-height:1.5">Você agora faz parte do ecossistema Zelaria.</p>
</td></tr>
<tr><td style="padding:36px 40px">
  <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7">
    A partir de agora, <strong>${firstName}</strong>, você faz parte do ecossistema da Zelaria.
    Em breve teremos novidades e disponibilizaremos primeiramente para você e para o <strong>${condominio}</strong>.
  </p>
  <div style="background:#faf5ff;border-radius:12px;padding:24px;margin:24px 0">
    <p style="margin:0 0 16px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7c3aed">O que vem a seguir</p>
    <table cellpadding="0" cellspacing="0">
      ${step('1','Análise do seu perfil','Revisamos o perfil do '+condominio+' para adequação ao piloto.')}
      ${step('2','Contato prioritário','Nossa equipe entrará em contato pelo WhatsApp '+(telefone?'('+telefone+')':'')+' para apresentar as novidades.')}
      ${step('3','Acesso antecipado','Você será o primeiro a conhecer e ativar a Zelaria — antes de qualquer lançamento público.')}
    </table>
  </div>
  <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6">Qualquer dúvida, responda este e-mail diretamente. Estamos aqui.</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center">
  <p style="margin:0;font-size:12px;color:#94a3b8">Zelaria · Inteligência Condominial com IA · <a href="https://zelaria.com.br" style="color:#a855f7;text-decoration:none">zelaria.com.br</a></p>
</td></tr>
</table></td></tr></table></body></html>`;

    await Promise.all([
      send('Zelaria <contato@zelaria.com.br>', 'alnascim.duda@gmail.com',
        `🏢 Nova lead — ${nome} · ${condominio}`, adminHtml),
      send('Zelaria <oi@zelaria.com.br>', email,
        `Maravilha, ${firstName}! Você faz parte do ecossistema Zelaria ✨`, leadHtml),
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}

function row(label, value) {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#94a3b8;font-weight:600;width:40%;vertical-align:top">${label}</td>
    <td style="padding:8px 0 8px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;font-weight:500">${value || '—'}</td>
  </tr>`;
}

function step(num, title, desc) {
  return `<tr>
    <td style="vertical-align:top;padding-bottom:16px;padding-right:12px;width:32px">
      <div style="width:28px;height:28px;background:#7c3aed;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:700">${num}</div>
    </td>
    <td style="padding-bottom:16px">
      <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1e1b4b">${title}</p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5">${desc}</p>
    </td>
  </tr>`;
}
