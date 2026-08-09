module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};

  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const required = ['name', 'phone', 'checkin', 'checkout'];
  for (const key of required) {
    if (!body[key] || String(body[key]).trim().length === 0) {
      return res.status(400).json({ error: `Missing field: ${key}` });
    }
  }

  const clean = value => String(value || '').trim().slice(0, 1000);
  const yesNo = value => value ? 'Да' : 'Нет';

  const text = [
    '🌿 Новая заявка с сайта «Место Силы»',
    '',
    `Имя: ${clean(body.name)}`,
    `Телефон: ${clean(body.phone)}`,
    `Telegram: ${clean(body.telegram) || 'не указан'}`,
    `Заезд: ${clean(body.checkin)}`,
    `Выезд: ${clean(body.checkout)}`,
    `Гости: ${clean(body.guests)}`,
    `Домик: ${clean(body.house) || 'любой свободный'}`,
    '',
    `Баня: ${yesNo(body.bath)}`,
    `Чан: ${yesNo(body.tub)}`,
    `Сап / лодка: ${yesNo(body.sup)}`,
    '',
    `Комментарий: ${clean(body.comment) || 'нет'}`,
    '',
    `Страница: ${clean(body.page)}`
  ].join('\n');

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('[DEMO BOOKING]', text);
    return res.status(200).json({ ok: true, mode: 'demo' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true
      })
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      console.error('Telegram error', result);
      return res.status(502).json({ error: 'Telegram delivery failed' });
    }

    return res.status(200).json({ ok: true, mode: 'telegram' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};
