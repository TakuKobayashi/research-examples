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

  app.get('/create_sample_database', async (req, res) => {
    const response = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: '9b9e71fe09f34566a5aebc3748dfb338',
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'Sample Database',
            link: null,
          },
        },
      ],
      properties: {
        text: {
          title: {},
        },
        richtext: {
          rich_text: {},
        },
        checkbox: {
          checkbox: {},
        },
        selectbox: {
          select: {
            options: [
              {
                name: '🥦Vegetable',
                color: 'green',
              },
              {
                name: '🍎Fruit',
                color: 'red',
              },
              {
                name: '💪Protein',
                color: 'yellow',
              },
            ],
          },
        },
        price: {
          number: {
            format: 'yen',
          },
        },
        date: {
          date: {},
        },
        multi_selectbox: {
          type: 'multi_select',
          multi_select: {
            options: [
              {
                name: 'Duc Loi Market',
                color: 'blue',
              },
              {
                name: 'Rainbow Grocery',
                color: 'gray',
              },
              {
                name: 'Nijiya Market',
                color: 'purple',
              },
              {
                name: "Gus'''s Community Market",
                color: 'yellow',
              },
            ],
          },
        },
        person: {
          people: {},
        },
        file: {
          files: {},
        },
      },
    });
    return response;
  });
}
