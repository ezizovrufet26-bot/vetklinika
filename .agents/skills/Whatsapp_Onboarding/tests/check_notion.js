const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function run() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    filter: {
      property: "Telefon",
      phone_number: {
        is_not_empty: true
      }
    }
  });
  console.log(response.results.map(r => r.properties.Telefon.phone_number));
}
run().catch(console.error);
