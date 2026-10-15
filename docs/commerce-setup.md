# Commerce setup

## PayPal

The checkout uses PayPal Orders v2. Keep the first integration in Sandbox and add these values to the local `.env.local` file. Do not commit the file or send credentials in chat.

```dotenv
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_WEBHOOK_ID=your_sandbox_webhook_id
```

After deploying, create a webhook in the PayPal developer account for `PAYMENT.CAPTURE.COMPLETED` and point it to `https://your-domain/api/checkout/paypal-webhook`. Store its webhook ID in `PAYPAL_WEBHOOK_ID`. Use a separate live app and live webhook ID when switching `PAYPAL_ENV=live`.

For a mainland-China merchant account, confirm that the account is enabled for the PayPal China cross-border checkout/API product before switching to live. PayPal documents that China Platform merchants receive cross-border payments and settle foreign-currency payments in CNY. PayPal receiving preferences also need to allow any currency used by the store; otherwise a payment can remain pending. See [PayPal country and currency support](https://developer.paypal.com/payouts/supported-features/) and [currency receiving preferences](https://developer.paypal.com/api/codes/currency/).

## Shipping and tax

Open **Admin → Store settings** (`/admin/globals/store-settings`). Configure the two optional order value conditions first: free shipping above a set order value (defaults to USD 50) and no shipping below a minimum order value. Then select the shipping cost type: Free shipping, Flat rate, Price, Weight, Number of items, or Advanced cost table. Only fields for the selected type appear. Weight ranges use kg and total package weight is calculated from each product's shipping weight times quantity. Advanced cost table matches two selected dimensions against each rate row. Checkout blocks orders below the minimum value and when no rate row matches. Prices are tax-inclusive, so checkout does not add a second tax charge.

## Product variants and bulk editing

Open **Admin → Products**. Add one row in **Variants** for each purchasable shape/length combination. Each row has its own SKU, optional price overrides, stock tracking, and enabled flag. Leave variant prices empty to inherit the product price. If a product has variants, customers must choose an enabled combination before adding it to the cart.

Payload's product list supports selecting multiple documents and bulk-editing shared fields. For spreadsheet import/export, install the Payload Import/Export plugin separately; it is not required for the built-in bulk editor.

The Merchant Center feed is available at `/api/merchant/feed.xml`. Set `NEXT_PUBLIC_SITE_URL=https://ginnynana.com` in the production environment so item links and images use the preserved domain. Add real product photos before submitting items; products without a featured image are omitted. Configure shipping rates separately in Merchant Center to match the shipping conditions and method configured in Payload; these settings do not sync automatically. The product editor includes optional GTIN, MPN, and Google category fields; do not invent identifiers for handmade products.

## Orders and discounts

Paid and pending checkouts are stored in **Admin → Orders**. PayPal confirmation updates payment status; the fulfillment status and tracking number can be maintained there. Customers can use **Order status** with their order number and checkout email to see payment/fulfillment state and tracking number. Create codes under **Admin → Discounts**. Discounts are recalculated on the server at checkout, and usage counts increase after PayPal confirms payment.
