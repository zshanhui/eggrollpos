const Airtable = require('airtable');

const airtableClient = new Airtable({apiKey: process.env.AIRTABLE_API_KEY || ''});

function getById(base, view, id) {
  const airtableBase = airtableClient.base(base);
  return airtableBase(view)
    .find(id)
    .then((data) => data);
}

function getByFilter(base, view, filters, strict) {
  const filterType = strict ? 'AND' : 'OR';
  const airtableBase = airtableClient.base(base);
  return airtableBase(view)
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
    const b = airtableClient.base(base);
    return await b(view).create(record.length ? record : [record]);
  } catch (err) {
    console.error('error >> ', err);
  }
}

module.exports = {
  getAirtableData,
  createRow,
};
