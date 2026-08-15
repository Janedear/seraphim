import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const api = createClientFromRequest(req);
        const user = await api.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        body = body || {};
        const { term, fields, categories, wildcard, case_sensitive } = body;

        if (!term || !fields || !Array.isArray(fields) || fields.length === 0) {
            return Response.json({ 
                error: 'Missing required parameters: term and fields are required' 
            }, { status: 400 });
        }

        const response = await fetch('https://breach.vip/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                term,
                fields,
                categories: categories || null,
                wildcard: wildcard || false,
                case_sensitive: case_sensitive || false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return Response.json({ 
                error: `BreachVIP API error: ${response.status}`,
                details: errorText 
            }, { status: response.status });
        }

        const data = await response.json();

        return Response.json({
            success: true,
            results: data.results || [],
            count: data.results?.length || 0
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});