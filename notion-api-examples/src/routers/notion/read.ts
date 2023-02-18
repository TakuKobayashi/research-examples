export async function notionApiRead(app, opts): Promise<void> {
  app.get('/', async (req, res) => {
    return { hello: 'notion api read' };
  });
}
