module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const { event_name, event_id, event_source_url, fbp, fbc } = body;

    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      res.status(500).json({ error: 'Server not configured: missing META_PIXEL_ID or META_ACCESS_TOKEN' });
      return;
    }

    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket && req.socket.remoteAddress);

    const userData = {
      client_ip_address: clientIp,
      client_user_agent: req.headers['user-agent'],
    };
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;

    const payload = {
      data: [
        {
          event_name: event_name || 'PageView',
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id,
          action_source: 'website',
          event_source_url: event_source_url,
          user_data: userData,
        },
      ],
    };

    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const result = await metaRes.json();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};
