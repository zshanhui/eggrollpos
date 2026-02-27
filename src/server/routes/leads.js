const express = require('express');
const router = express.Router();

router.post('/', async (req, res, _next) => {
  const {name, email, website, description} = req.body;
  // TODO: store in database once admin UI is built
  console.log('Contact form submission:', { name, email, website, description });
  res.redirect('/');
});

module.exports = router;
