import axios from '../utils/http';
import { TagGroup } from 'postybirb-commons';

export default class TagGroupService {
  static getAll() {
    return axios.get<TagGroup[]>('/tag-group');
  }

  static deleteTagGroup(id: string) {
    return axios.delete(`/tag-group/${id}`);
  }

  static update(tagGroup: TagGroup) {
    return axios.patch('/tag-group/update', tagGroup);
  }

  static create(tagGroup: Partial<TagGroup>) {
    return axios.post<TagGroup>('/tag-group/create', tagGroup);
  }
}
