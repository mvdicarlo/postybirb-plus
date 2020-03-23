import { EntityIntf } from '../../database/interfaces/entity.interface';

export interface TagConverter extends EntityIntf {
  tag: string;
  conversions: Record<string /* Website ID */, string>;
}
