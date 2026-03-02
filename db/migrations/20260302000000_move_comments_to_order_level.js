/**
 * Move comments from line_items to orders.
 * Comments are general order-level notes; line items only have modifiers.
 */

exports.up = function(knex) {
  return knex.schema
    .alterTable('orders', t => {
      t.text('comments');
    })
    .then(() => knex.schema.alterTable('line_items', t => {
      t.dropColumn('comments');
    }));
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('line_items', t => {
      t.text('comments');
    })
    .then(() => knex.schema.alterTable('orders', t => {
      t.dropColumn('comments');
    }));
};
