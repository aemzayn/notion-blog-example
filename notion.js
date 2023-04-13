import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { NotionToMarkdown } from "notion-to-md";
import { sanitizeDOM } from "./utils/sanitize-dom.js";
import { parseMarkdown } from "./utils/parse-markdown.js";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

const databaseId = process.env.NOTION_DATABASE_ID;
const propertyId = {
  title: process.env.NOTION_TITLE_ID,
  tags: process.env.NOTION_TAGS_ID,
  authors: process.env.NOTION_AUTHOR_ID,
  createdTime: process.env.NOTION_CREATED_TIME_ID,
};

async function getPropertiesId() {
  const response = await notion.databases.retrieve({
    database_id: databaseId,
  });
  const properties = notionPropertiesById(response.properties);
  console.log(properties);
}

// getPropertiesId()

async function getOptions() {
  try {
    const response = await notion.databases.retrieve({
      database_id: databaseId,
    });
    const properties = notionPropertiesById(response.properties);
    const tags = properties[propertyId.tags].multi_select.options;
    const authors = properties[propertyId.authors].select.options;
    return { tags, authors };
  } catch (error) {
    return { tags: [], authors: [] };
  }
}

async function createPost({ title, tags = [], authors }) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        [propertyId.title]: {
          title: [
            {
              type: "text",
              text: { content: title },
            },
          ],
        },
        [propertyId.tags]: {
          multi_select: tags.map((tag) => ({ id: tag })),
        },
        [propertyId.authors]: {
          select: { id: authors },
        },
      },
    });
    console.log(response);
  } catch (error) {
    console.error(error.body);
  }
}

function notionPropertiesById(properties) {
  return Object.values(properties).reduce((obj, property) => {
    const { id, ...rest } = property;
    return { ...obj, [id]: rest };
  }, {});
}

async function getPosts() {
  const notionPages = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ property: propertyId.createdTime, direction: "descending" }],
  });

  return notionPages.results.map(fromNotionObject);
}

async function getPost(id) {
  const notionPage = await notion.pages.retrieve({ page_id: id });
  const markdown = await notionMarkdown(id);
  notionPage.content = markdown;
  return fromNotionObject(notionPage);
}

async function notionMarkdown(pageId) {
  const mdblocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdblocks);
  const parsed = sanitizeDOM(parseMarkdown(mdString));
  return parsed;
}

function fromNotionObject(notionPage) {
  const propertiesById = notionPropertiesById(notionPage.properties);

  return {
    id: notionPage.id,
    cover: notionPage.cover,
    title: propertiesById[propertyId.title].title[0].plain_text,
    tags: propertiesById[propertyId.tags].multi_select.map((option) => {
      return { id: option.id, name: option.name, color: option.color };
    }),
    authors: propertiesById[propertyId.authors].select,
    content: notionPage.content,
  };
}

export { createPost, getOptions, getPosts, getPost };
