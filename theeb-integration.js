// theeb-router Integration Code

// داخل دالة processCommand()
if (command.includes('محلي') || command.includes('ollama') || command.includes('qwen')) {
  return await agents['theeb-router'].execute(prompt, { model: 'qwen' });
}

if (command.includes('سريع') || command.includes('بسيط')) {
  return await agents['theeb-router'].execute(prompt, { model: 'minimax' });
}
