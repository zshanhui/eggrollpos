const Merchants = require('../models/merchants').default;

/**
 * Resolve :merchantId route param from hash_id, uuid, or numeric id.
 * Sets req.merchant and req.merchantId (numeric) for downstream handlers.
 */
async function resolveMerchantMiddleware(req, res, next) {
  try {
    const merchant = await Merchants.resolveFromParam(req.params.merchantId);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    req.merchant = merchant;
    req.merchantId = merchant.id;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { resolveMerchantMiddleware };
