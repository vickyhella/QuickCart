import * as migration_20261013_085525 from './20261013_085525';
import * as migration_20261013_143230_addStudioDescriptionTemplate from './20261013_143230_addStudioDescriptionTemplate';
import * as migration_20261014_110652_add_marketing_workspace from './20261014_110652_add_marketing_workspace';
import * as migration_20261014_233000_add_store_settings_checkout_fields from './20261014_233000_add_store_settings_checkout_fields';
import * as migration_20261015_160600_add_product_shipping_weight from './20261015_160600_add_product_shipping_weight';
import * as migration_20261015_170000_add_shipping_tier_weight_ranges from './20261015_170000_add_shipping_tier_weight_ranges';
import * as migration_20261015_180000_add_gmc_shipping_configuration from './20261015_180000_add_gmc_shipping_configuration';
import * as migration_20261016_110000_add_r2_object_keys from './20261016_110000_add_r2_object_keys';
import * as migration_20261017_170000_add_suppliers from './20261017_170000_add_suppliers';
import * as migration_20261017_190000_add_supplier_linked_products_count from './20261017_190000_add_supplier_linked_products_count';
import * as migration_20261017_210000_add_product_dimensions from './20261017_210000_add_product_dimensions';
import * as migration_20261020_120000_add_customers from './20261020_120000_add_customers';
import * as migration_20261020_122640_add_woocommerce_customer_order_history_fields from './20261020_122640_add_woocommerce_customer_order_history_fields';

export const migrations = [
  {
    up: migration_20261013_085525.up,
    down: migration_20261013_085525.down,
    name: '20261013_085525',
  },
  {
    up: migration_20261013_143230_addStudioDescriptionTemplate.up,
    down: migration_20261013_143230_addStudioDescriptionTemplate.down,
    name: '20261013_143230_addStudioDescriptionTemplate',
  },
  {
    up: migration_20261014_110652_add_marketing_workspace.up,
    down: migration_20261014_110652_add_marketing_workspace.down,
    name: '20261014_110652_add_marketing_workspace'
  },
  {
    up: migration_20261014_233000_add_store_settings_checkout_fields.up,
    down: migration_20261014_233000_add_store_settings_checkout_fields.down,
    name: '20261014_233000_add_store_settings_checkout_fields'
  },
  {
    up: migration_20261015_160600_add_product_shipping_weight.up,
    down: migration_20261015_160600_add_product_shipping_weight.down,
    name: '20261015_160600_add_product_shipping_weight'
  },
  {
    up: migration_20261015_170000_add_shipping_tier_weight_ranges.up,
    down: migration_20261015_170000_add_shipping_tier_weight_ranges.down,
    name: '20261015_170000_add_shipping_tier_weight_ranges'
  },
  {
    up: migration_20261015_180000_add_gmc_shipping_configuration.up,
    down: migration_20261015_180000_add_gmc_shipping_configuration.down,
    name: '20261015_180000_add_gmc_shipping_configuration'
  },
  {
    up: migration_20261016_110000_add_r2_object_keys.up,
    down: migration_20261016_110000_add_r2_object_keys.down,
    name: '20261016_110000_add_r2_object_keys'
  },
  {
    up: migration_20261017_170000_add_suppliers.up,
    down: migration_20261017_170000_add_suppliers.down,
    name: '20261017_170000_add_suppliers'
  },
  {
    up: migration_20261017_190000_add_supplier_linked_products_count.up,
    down: migration_20261017_190000_add_supplier_linked_products_count.down,
    name: '20261017_190000_add_supplier_linked_products_count'
  },
  {
    up: migration_20261017_210000_add_product_dimensions.up,
    down: migration_20261017_210000_add_product_dimensions.down,
    name: '20261017_210000_add_product_dimensions'
  },
  {
    up: migration_20261020_120000_add_customers.up,
    down: migration_20261020_120000_add_customers.down,
    name: '20261020_120000_add_customers'
  },
  {
    up: migration_20261020_122640_add_woocommerce_customer_order_history_fields.up,
    down: migration_20261020_122640_add_woocommerce_customer_order_history_fields.down,
    name: '20261020_122640_add_woocommerce_customer_order_history_fields',
  },
];
