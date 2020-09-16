import { EntityIntf } from '../database/entity.interface';

export interface TagConverter extends EntityIntf {
  tag: string;
  conversions: Record<string /* Website ID */, string>;
}
