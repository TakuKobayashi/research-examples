import { Client } from "@notionhq/client"

const notion = new Client({
  auth: process.env.NOTION_INTERNAL_INTEGRATION_TOKEN,
})

export async function notionApiRead(app, opts): Promise<void> {
  app.get('/', async (req, res) => {
    return { hello: 'notion api read' };
  });

  app.get('/users', async (req, res) => {
    const listUsersResponse = await notion.users.list({})
    return listUsersResponse;
  });

  app.get('/me', async (req, res) => {
    const response = await notion.users.me({});
    return response;
  });

  app.get('/pages', async (req, res) => {
    const response = await notion.search({})
    return response;
  });
}
