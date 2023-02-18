import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_INTERNAL_INTEGRATION_TOKEN,
});

export async function notionApiPost(app, opts): Promise<void> {
  app.get('/', async (req, res) => {
    return { hello: 'notion api post' };
  });

  app.get('/create_sample_page', async (req, res) => {
    const response = await notion.pages.create({
      parent: {
        type: 'page_id',
        page_id: '9b9e71fe09f34566a5aebc3748dfb338',
      },
      properties: {
        title: [
          {
            text: {
              content: 'Notion API Test',
            },
          },
        ],
      },
    });
    return response;
  });

  app.get('/add_sample_database', async (req, res) => {
    const response = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: '9b9e71fe09f34566a5aebc3748dfb338',
      },
      properties: {
        text: {
          title: {},
        },
      },
    });
    return response;
  });

  app.get('/add_data_to_sample_database', async (req, res) => {
    const response = await notion.pages.create({
      parent: {
        type: 'database_id',
        database_id: '01e15323-833f-466a-9faa-42289dafc3ff',
      },
      properties: {
        text: {
          title: [
            {
              text: {
                content: 'hogehoge',
              },
            },
          ],
        },
      },
    });
    return response;
  });
}
