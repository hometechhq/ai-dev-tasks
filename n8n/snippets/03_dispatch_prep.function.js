// n8n Function node: prepare Envelope actions for routing
// Input item: { envelope: <ReturnEnvelope JSON> }
// Output items: one per action, with routing hints

const env = $json.envelope;
if (!env || !Array.isArray(env.actions)) {
  throw new Error('Missing envelope.actions');
}

return env.actions.map(a => {
  const tool = a.tool;
  const group = tool.startsWith('fs.') ? 'fs'
             : tool.startsWith('github.') ? 'github'
             : tool.startsWith('test.') ? 'test'
             : tool.startsWith('eval.') ? 'eval'
             : 'unknown';
  return {
    json: {
      tool,
      group,
      args: a.args || {},
      resultRef: a.resultRef || null
    }
  };
});
