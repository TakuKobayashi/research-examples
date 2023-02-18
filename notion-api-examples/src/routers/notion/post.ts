export async function notionApiPost(app, opts): Promise<void> {
  app.get('/', async (req, res) => {
    return {hello: "notion api post"}
  });
}