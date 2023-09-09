import Axios from 'axios';

export const FurtasticTagSearchProvider = (value: string) => {
  return Axios.get('https://api.furtastic.art/public/tag?', {
    params: {
      expiry: '7',
      'q': value
    }
  })
    .then(({ data }) => (data.tags || []).map(d => d.tag))
    .catch(err => {
      console.error(err);
      return [];
    });
};
