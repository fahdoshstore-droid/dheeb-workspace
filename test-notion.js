const axios = require('axios');

const NOTION_API_KEY = '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';
const PAGE_ID = '4915fe1034ab42078c6d74de8853283f';

const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

async function getNotionPageContent(pageId) {
  try {
    const response = await axios.get(`https://api.notion.com/v1/blocks/${pageId}/children`, { headers });
    const blocks = response.data.results;
    let content = '';
    blocks.forEach(block => {
      if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
        content += block.paragraph.rich_text.map(t => t.plain_text).join('') + '\\n';
      }
    });
    console.log('--- محتوى الصفحة ---');
    console.log(content);
    console.log('--- انتهى ---');
  } catch (error) {
    console.error('--- خطأ ---');
    console.error('فشل في قراءة الصفحة:', error.response ? error.response.data : error.message);
    console.error('--- انتهى ---');
  }
}

getNotionPageContent(PAGE_ID);
