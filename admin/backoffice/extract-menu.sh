#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INPUT="$SCRIPT_DIR/easternexpress.json"
OUTPUT="$SCRIPT_DIR/easternexpressmenu.csv"

python3 -c "
import json, csv

with open('$INPUT') as f:
    data = json.load(f)

seen_items = set()
seen_modifiers = set()
item_rows = []
modifier_rows = []

for cat in data.get('menu_categories', []):
    cat_name = cat.get('name', '')
    for item in cat.get('menu_items', []):
        item_name = item.get('name', '').replace('\n', ' ').strip()
        price = item.get('price', 0)
        price_dollars = f'\${price / 100:,.2f}' if price else '\$0.00'

        key = (cat_name, item_name, price)
        if key not in seen_items:
            seen_items.add(key)
            item_rows.append({'category': cat_name, 'item': item_name, 'price': price_dollars})

        for label in item.get('menu_option_labels', []):
            label_name = label.get('name', '')
            for opt in label.get('menu_options', []):
                opt_name = opt.get('name', '').replace('\n', ' ').strip()
                opt_price = opt.get('price', 0)
                opt_price_dollars = f'\${opt_price / 100:,.2f}' if opt_price else '\$0.00'

                mod_key = (label_name, opt_name, opt_price)
                if mod_key not in seen_modifiers:
                    seen_modifiers.add(mod_key)
                    modifier_rows.append({'category': label_name, 'item': opt_name, 'price': opt_price_dollars})

with open('$OUTPUT', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['category', 'item', 'price'])
    w.writeheader()
    w.writerows(item_rows)
    # Blank separator row, then modifiers section
    w.writerow({'category': '', 'item': '--- MODIFIERS ---', 'price': ''})
    w.writerows(modifier_rows)

print(f'Wrote {len(item_rows)} items + {len(modifier_rows)} unique modifiers to $OUTPUT')
"
