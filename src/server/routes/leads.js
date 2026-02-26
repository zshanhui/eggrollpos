const express = require('express');
const router = express.Router();
const Airtable = require('../services/airtable');

router.post('/', async (req, res, _next) => {
  /**
   * 1. Store in database
   * 2. Push to airtable
   */
  console.log('req form body', req.body);
  const {name, email, website, description} = req.body;
  const results = await Airtable.createRow({
    fields: {
      contact_name: name,
      contact_email: email,
      business_website: website,
      project_description: description,
    }
  }, process.env.AIRTABLE_BASE_ID || 'apprGh6ClNnx85B8m', 'Contact Form');
  console.log('Saved to airtable... ', results);
  res.redirect('/');
});

module.exports = router;
