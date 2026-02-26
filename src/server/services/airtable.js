const Airtable = require('airtable');

let airtableClient = null;

function getClient() {
  if (!airtableClient) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    if (!apiKey) {
      console.warn('AIRTABLE_API_KEY not set — Airtable integration disabled');
      return null;
    }
    airtableClient = new Airtable({ apiKey });
  }
  return airtableClient;
}

function getById(base, view, id) {
  const client = getClient();
  if (!client) return Promise.resolve(null);
  return client.base(base)(view)
    .find(id)
    .then((data) => data);
}

function getByFilter(base, view, filters, strict) {
  const client = getClient();
  if (!client) return Promise.resolve([]);
  const filterType = strict ? 'AND' : 'OR';
  return client.base(base)(view)
    .select({
      filterByFormula: `${filterType}(${filters.join(',')})`,
    })
    .all();
}

function getAirtableData(base, view, query) {
  const filters = [];
  let strict = true;
  Object.keys(query).map((key) => {
    if (query[key].includes(',')) {
      strict = false;
      query[key]
        .split(',')
        .map((subquery) => filters.push(`"${subquery}"={${key}}`));
    } else if (key === 'id') {
      return getById(base, view, query[key]);
    } else {
      filters.push(`"${query[key]}"={${key}}`);
    }
    return filters;
  });
  return getByFilter(base, view, filters, strict);
}

async function createRow(record, base, view = 'Contact Form') {
  try {
    const client = getClient();
    if (!client) return null;
    const b = client.base(base);
    return await b(view).create(record.length ? record : [record]);
  } catch (err) {
    console.error('Airtable createRow error:', err);
  }
}

module.exports = {
  getAirtableData,
  createRow,
};
