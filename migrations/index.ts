import * as migration_20261013_085525 from './20261013_085525';
import * as migration_20261013_143230_addStudioDescriptionTemplate from './20261013_143230_addStudioDescriptionTemplate';

export const migrations = [
  {
    up: migration_20261013_085525.up,
    down: migration_20261013_085525.down,
    name: '20261013_085525',
  },
  {
    up: migration_20261013_143230_addStudioDescriptionTemplate.up,
    down: migration_20261013_143230_addStudioDescriptionTemplate.down,
    name: '20261013_143230_addStudioDescriptionTemplate'
  },
];
