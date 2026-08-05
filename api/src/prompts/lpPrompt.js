function buildLpPrompt({
  serviceName,
  concept,
  targetUser,
  tone,
  mainMessage
}) {
  return `
Create a landing page visual for a web service.

Service name: ${serviceName}
Concept: ${concept}
Target user: ${targetUser}
Tone: ${tone}
Main message: ${mainMessage}

Create a visually appealing hero-style landing page image suitable for later grid-splitting and HTML layout reconstruction.
  `.trim();
}

module.exports = {
  buildLpPrompt
};