import type { VercelRequest, VercelResponse } from '@vercel/node';

const TIMEOUT = 15000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const {
        TEKAE_BEARER_TOKEN,
        TEKAE_UID,
        TEKAE_PASSWORD,
        TEKAE_CIPHER_URL,
        TEKAE_GENERATE_TOKEN_URL,
        TEKAE_RESPONSIVE_BASE_URL
    } = process.env as Record<string, string | undefined>;

    if (!TEKAE_BEARER_TOKEN || !TEKAE_UID || !TEKAE_PASSWORD || !TEKAE_CIPHER_URL || !TEKAE_GENERATE_TOKEN_URL || !TEKAE_RESPONSIVE_BASE_URL) {
        return res.status(500).json({ error: 'Tekae configuration missing on server' });
    }

    const body = req.body || {};
    const email = body.email;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEKAE_BEARER_TOKEN}`
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        // 1) Call /tokens/cipherData
        const cipherUrl = `${TEKAE_CIPHER_URL.replace(/\/$/, '')}/tokens/cipherData`;
        const cipherPayload = {
            UserCustomer: email,
            uid: TEKAE_UID,
            password: TEKAE_PASSWORD,
            redirect: true,
            menu: null,
            categoria: null,
            carrier: null,
            blockview: false
        };

        const r1 = await fetch(cipherUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(cipherPayload),
            signal: controller.signal
        });

        if (!r1.ok) {
            const text = await r1.text();
            console.error('cipherData error', r1.status, text);
            clearTimeout(timeout);
            return res.status(502).json({ error: 'Tekae cipherData error', details: text });
        }

        const cipherData = await r1.json();

        // 2) Call /tokens/generateTokenCiphered with data from previous response
        const generateUrl = `${TEKAE_GENERATE_TOKEN_URL.replace(/\/$/, '')}/tokens/generateTokenCiphered`;
        const genPayload = {
            uid: TEKAE_UID,
            data: cipherData?.data ?? cipherData
        };

        const r2 = await fetch(generateUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(genPayload),
            signal: controller.signal
        });

        if (!r2.ok) {
            const text = await r2.text();
            console.error('generateTokenCiphered error', r2.status, text);
            clearTimeout(timeout);
            return res.status(502).json({ error: 'Tekae generateTokenCiphered error', details: text });
        }

        const genData = await r2.json();
        const accessToken = genData?.accessToken || genData?.token || genData?.data?.accessToken;
        if (!accessToken) {
            clearTimeout(timeout);
            console.error('missing accessToken in generate response', genData);
            return res.status(502).json({ error: 'Missing accessToken from Tekae' });
        }

        // 3) Build responsive URL and call it with Bearer token
        const finalUrl = `${TEKAE_RESPONSIVE_BASE_URL.replace(/\/$/, '')}/responsive/user/${TEKAE_UID}/token/${accessToken}`;

        const r3 = await fetch(finalUrl, {
            method: 'GET',
            headers,
            signal: controller.signal
        });

        if (!r3.ok) {
            const text = await r3.text();
            console.error('responsive fetch error', r3.status, text);
            clearTimeout(timeout);
            return res.status(502).json({ error: 'Tekae responsive error', details: text });
        }

        const responsive = await r3.json().catch(() => ({}));
        clearTimeout(timeout);

        // Do not expose uid/password in response for security
        return res.status(200).json({ ok: true, accessToken, finalUrl, responsive });
    } catch (err: any) {
        clearTimeout(timeout);
        console.error('tekae-token handler error', err);
        if (err.name === 'AbortError') return res.status(504).json({ error: 'Tekae request timed out' });
        return res.status(504).json({ error: 'Tekae request failed', details: String(err) });
    }
}
