import axios from '../utils/http';
import { TagGroup } from '../../../electron-app/src/tag-group/tag-group.interface';
import { AxiosResponse } from 'axios';

export default class TagGroupService {
  static getAll() {
    return axios.get<TagGroup[]>('/tag-group');
  }

  static deleteTagGroup(id: string) {
    return axios.delete(`/tag-group/${id}`);
  }

  static update(tagGroup: TagGroup) {
    return axios.patch('/tag-group', tagGroup);
  }

  static create(tagGroup: TagGroup) {
    return axios.post<TagGroup>('/tag-group', tagGroup);
  }
}
