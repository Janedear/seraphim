import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EXTERNAL_APIS = {
  nmap: Deno.env.get('NMAP_API_URL') || 'https://nmap.online/api/scan',
};

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tool_name, target, profile = 'basic', agent_context } = await req.json();

    // Validate inputs
    if (!tool_name || !target) {
      return Response.json(
        { error: 'tool_name and target are required' },
        { status: 400 }
      );
    }

    // Fetch tool configuration
    const toolConfigs = await api.entities.ToolConfig.filter({ tool_name });
    if (toolConfigs.length === 0) {
      return Response.json({ error: `Tool '${tool_name}' not configured` }, { status: 404 });
    }

    const toolConfig = toolConfigs[0];

    // Check if tool is enabled
    if (!toolConfig.enabled) {
      return Response.json(
        { error: `Tool '${tool_name}' is currently disabled` },
        { status: 403 }
      );
    }

    // Check agent permissions
    const userTeam = user.role === 'admin' ? 'both' : user.team || 'blue_team';
    if (
      toolConfig.agent_permissions &&
      toolConfig.agent_permissions.length > 0 &&
      !toolConfig.agent_permissions.includes(userTeam) &&
      !toolConfig.agent_permissions.includes('both')
    ) {
      return Response.json(
        { error: `User does not have permission to use tool '${tool_name}'` },
        { status: 403 }
      );
    }

    const startTime = Date.now();
    let scanResult;
    let error = null;
    let status = 'running';

    try {
      // Create scan run record
      const scanRun = await api.entities.ScanRun.create({
        tool_name,
        target,
        profile,
        status: 'running',
        execution_mode: toolConfig.execution_mode,
        request_payload: { target, profile },
        executed_by: user.email,
        executed_at: new Date().toISOString(),
        agent_context,
      });

      // Execute based on mode (simulation mode removed - use external_api or local_agent only)
      if (toolConfig.execution_mode === 'simulation') {
        return Response.json(
          { error: 'Simulation mode is not supported. Configure external_api or local_agent for real execution.' },
          { status: 400 }
        );
      }
      if (toolConfig.execution_mode === 'external_api' && EXTERNAL_APIS[tool_name]) {
        // Call external API
        const apiUrl = toolConfig.api_base_url || EXTERNAL_APIS[tool_name];
        
        const profileConfig = {
          basic: { args: '-p 80,443,22' },
          standard: { args: '-sV -sC' },
          deep: { args: '-sV -sC -O --script vuln' },
          aggressive: { args: '-A -T4' },
        };

        const config = profileConfig[profile] || profileConfig.basic;

        const apiResponse = await fetch(`${apiUrl}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target,
            args: config.args,
            timeout: toolConfig.timeout_seconds || 300,
          }),
        });

        if (!apiResponse.ok) {
          throw new Error(`API error: ${apiResponse.statusText}`);
        }

        scanResult = await apiResponse.json();
        status = 'completed';
      } else if (toolConfig.execution_mode === 'local_agent') {
        return Response.json(
          { error: 'Local agent execution not yet implemented' },
          { status: 501 }
        );
      } else {
        throw new Error('Unknown execution mode');
      }

      // Update scan run with results
      const executionTime = Date.now() - startTime;
      await api.entities.ScanRun.update(scanRun.id, {
        status,
        response_data: scanResult,
        execution_time_ms: executionTime,
      });

      return Response.json({
        success: true,
        scan_id: scanRun.id,
        tool: tool_name,
        target,
        profile,
        status,
        execution_time_ms: executionTime,
        data: scanResult,
      });
    } catch (execError) {
      status = 'failed';
      error = execError.message;

      // Log failed scan
      const scanRun = await api.entities.ScanRun.create({
        tool_name,
        target,
        profile,
        status: 'failed',
        execution_mode: toolConfig.execution_mode,
        request_payload: { target, profile },
        error_message: error,
        executed_by: user.email,
        executed_at: new Date().toISOString(),
        agent_context,
        execution_time_ms: Date.now() - startTime,
      });

      return Response.json(
        { error, scan_id: scanRun.id },
        { status: 500 }
      );
    }
  } catch (error) {
    return Response.json(
      { error: error.message || 'Tool execution failed' },
      { status: 500 }
    );
  }
});