import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_ADMIN = 'Zelaria <contato@zelaria.com.br>';
const FROM_LEAD  = 'Zelaria <oi@zelaria.com.br>';
const ADMIN_EMAIL = 'alnascim.duda@gmail.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendEmail(from: string, to: string | string[], subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  return res.ok;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const {
      nome = '', email = '', condominio = '', cep = '',
      apartamentos = '', telefone = '', dor = '',
      imagem_condominio_url = '',
    } = await req.json();

    const firstName = nome.split(' ')[0] || nome;

    // ── E-mail para a equipe ──────────────────────────────────────────────
    const adminHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 40px;text-align:center">
            <p style="margin:0;color:#e9d5ff;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Nova Lead · Zelaria Beta</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800">🏢 ${condominio || '—'}</h1>
            <p style="margin:6px 0 0;color:#ddd6fe;font-size:14px">${nome}</p>
          </td>
        </tr>

        <!-- Dados -->
        <tr>
          <td style="padding:32px 40px">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${row('👤 Nome', nome)}
              ${row('🏢 Condomínio', condominio)}
              ${row('📍 CEP', cep)}
              ${row('🏠 Apartamentos', apartamentos)}
              ${row('📱 Telefone', telefone)}
              ${row('✉️ E-mail', email)}
            </table>

            <!-- Dor operacional -->
            <div style="margin-top:24px;background:#faf5ff;border-left:4px solid #a855f7;border-radius:0 8px 8px 0;padding:16px 20px">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7c3aed">Maior Dor Operacional</p>
              <p style="margin:0;font-size:14px;color:#1e1b4b;line-height:1.6">${dor || '—'}</p>
            </div>

            ${imagem_condominio_url ? `
            <!-- Foto -->
            <div style="margin-top:24px;text-align:center">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b">Foto da Fachada</p>
              <a href="${imagem_condominio_url}" target="_blank">
                <img src="${imagem_condominio_url}" alt="Fachada" style="max-width:100%;border-radius:12px;border:1px solid #e2e8f0" />
              </a>
            </div>` : ''}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">Zelaria · Facilities Guiados por IA</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ── E-mail de boas-vindas para o lead ─────────────────────────────────
    const leadHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:40px 40px 32px;text-align:center">
            <p style="margin:0;font-size:32px">✨</p>
            <h1 style="margin:12px 0 0;color:#ffffff;font-size:28px;font-weight:800">${firstName}, você está dentro!</h1>
            <p style="margin:10px 0 0;color:#ddd6fe;font-size:15px;line-height:1.5">Sua vaga no piloto exclusivo da Zelaria está reservada.</p>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="padding:36px 40px">
            <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7">
              Olá, <strong>${firstName}</strong>! Ficamos muito felizes em ter o <strong>${condominio}</strong> no nosso piloto.
            </p>
            <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7">
              Estamos selecionando os primeiros condomínios para validar a Zelaria em campo.
              Quando sua vaga for ativada, você será o <strong>primeiro a saber</strong> — antes de qualquer lançamento público.
            </p>

            <!-- O que esperar -->
            <div style="background:#faf5ff;border-radius:12px;padding:24px;margin:24px 0">
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7c3aed">O que vem a seguir</p>
              <table cellpadding="0" cellspacing="0">
                ${step('1', 'Análise do seu perfil', 'Revisamos as informações do ' + condominio + ' para adequação ao piloto.')}
                ${step('2', 'Contato em até 48h', 'Nossa equipe entra em contato pelo WhatsApp ' + (telefone ? '(' + telefone + ')' : '') + ' para agendar uma demo.')}
                ${step('3', 'Acesso antecipado', 'Você ativa a Zelaria antes do lançamento público — sem custo no piloto.')}
              </table>
            </div>

            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6">
              Qualquer dúvida, responda este e-mail diretamente. Estamos aqui.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">Zelaria · Facilities Guiados por IA · <a href="https://zelaria.com.br" style="color:#a855f7;text-decoration:none">zelaria.com.br</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Dispara os dois em paralelo
    await Promise.all([
      sendEmail(FROM_ADMIN, ADMIN_EMAIL, `🏢 Nova lead — ${nome} · ${condominio}`, adminHtml),
      sendEmail(FROM_LEAD,  email,       `${firstName}, você está na lista! ✨ — Zelaria`, leadHtml),
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

// helpers
function row(label: string, value: string) {
  return `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#94a3b8;font-weight:600;width:40%;vertical-align:top">${label}</td>
    <td style="padding:8px 0 8px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;font-weight:500">${value || '—'}</td>
  </tr>`;
}

function step(num: string, title: string, desc: string) {
  return `
  <tr>
    <td style="vertical-align:top;padding-bottom:16px;padding-right:12px;width:32px">
      <div style="width:28px;height:28px;background:#7c3aed;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:700">${num}</div>
    </td>
    <td style="padding-bottom:16px">
      <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1e1b4b">${title}</p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5">${desc}</p>
    </td>
  </tr>`;
}
