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

  app.get('/create_sample_page_with_block', async (req, res) => {
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
      children: [
        {
          object: 'block',
          heading_2: {
            rich_text: [
              {
                text: {
                  content: 'Lacinato kale',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          paragraph: {
            rich_text: [
              {
                text: {
                  content:
                    'Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.',
                  link: {
                    url: 'https://en.wikipedia.org/wiki/Lacinato_kale',
                  },
                },
              },
            ],
            color: 'default',
          },
        },
      ],
    });
    return response;
  });

  app.get('/create_sample_database', async (req, res) => {
    const response = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: '9b9e71fe09f34566a5aebc3748dfb338',
      },
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

  app.get('/apend_blocks', async (req, res) => {
    const response = await notion.blocks.children.append({
      block_id: req.query.page_id,
      children: [
        {
          heading_2: {
            rich_text: [
              {
                text: {
                  content: 'Lacinato kale',
                },
              },
            ],
          },
        },
        {
          paragraph: {
            rich_text: [
              {
                text: {
                  content:
                    'Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.',
                  link: {
                    url: 'https://en.wikipedia.org/wiki/Lacinato_kale',
                  },
                },
              },
            ],
          },
        },
      ],
    });
    return response;
  });
}
