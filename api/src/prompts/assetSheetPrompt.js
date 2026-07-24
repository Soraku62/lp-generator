function buildAssetSheetPrompt(project) {
  return `
Create a clean UI component asset sheet for a landing page design.

Project information:
- Service name: ${project.serviceName || "Untitled Service"}
- Concept: ${project.concept}
- Target user: ${project.targetUser}
- Tone: ${project.tone || "modern, clean, soft"}
- Main message: ${project.mainMessage || "A clear and engaging landing page"}

Important safety and design rules:
- Create only generic, original UI design elements.
- Do not create real people, celebrities, existing characters, copyrighted characters, or recognizable brand logos.
- Do not create a finished landing page.
- Do not imitate a specific existing brand or creator.
- Use simple placeholder shapes instead of readable text.
- Use a clean light background.
- Keep every asset isolated and reusable.
- Arrange the assets neatly on a clear 4x4 grid.
- Put only one main asset in each grid cell.
- Keep every asset fully inside its own cell.
- Leave clear spacing between cells.
- Do not let assets overlap across grid boundaries.

Include these generic landing page assets:
1. abstract brand mark placeholder
2. headline text placeholder block
3. primary call-to-action button
4. secondary button or input field
5. abstract hero visual icon
6. feature card component 1
7. feature card component 2
8. feature card component 3
9. decorative wave shape
10. soft glow background shape
11. navigation bar component
12. small dashboard panel
13. circular badge icon
14. simple chat bubble icon
15. small statistics card
16. decorative floating icon

Visual style:
- modern SaaS
- clean
- soft gradient
- futuristic but simple
- blue and purple accent colors
- polished UI kit presentation

Output goal:
A reusable 1024x1024 UI asset sheet arranged neatly on a 4x4 grid for later grid splitting.
  `.trim();
}

module.exports = {
  buildAssetSheetPrompt
};