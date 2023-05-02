import Axios from 'axios';

export const e621TagSearchProvider = (value: string) => {
  return Axios.get('https://e621.net/tags/autocomplete.json?', {
    params: {
      expiry: '7',
      'search[name_matches]': value
    }
  })
    .then(({ data }) => (data || []).map(d => d.name))
    .catch(err => {
      console.error(err);
      return [];
    });
};
