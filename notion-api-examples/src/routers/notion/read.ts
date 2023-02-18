import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_INTERNAL_INTEGRATION_TOKEN,
});

export async function notionApiRead(app, opts): Promise<void> {
  app.get('/', async (req, res) => {
    return { hello: 'notion api read' };
  });

  app.get('/users', async (req, res) => {
    const listUsersResponse = await notion.users.list({});
    return listUsersResponse;
  });

  app.get('/me', async (req, res) => {
    const response = await notion.users.me({});
    return response;
  });

  app.get('/pages', async (req, res) => {
    const response = await notion.search({});
    return response;
  });

  app.get('/page', async (req, res) => {
    const response = await notion.pages.retrieve({ page_id: req.query.page_id });
    return response;
  });

  app.get('/blocks', async (req, res) => {
    const response = await notion.blocks.children.list({
      block_id: req.query.page_id,
      page_size: 100,
    });
    return response;
  });

  app.get('/databases', async (req, res) => {
    const response = await notion.search({
      filter: {
        value: 'database',
        property: 'object'
      },
    });
    return response;
  });
}
