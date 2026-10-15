import * as migration_20261013_085525 from './20261013_085525';
import * as migration_20261013_143230_addStudioDescriptionTemplate from './20261013_143230_addStudioDescriptionTemplate';
import * as migration_20261014_110652_add_marketing_workspace from './20261014_110652_add_marketing_workspace';
import * as migration_20261014_233000_add_store_settings_checkout_fields from './20261014_233000_add_store_settings_checkout_fields';

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
];
