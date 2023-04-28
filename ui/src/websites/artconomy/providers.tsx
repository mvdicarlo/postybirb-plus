import Axios from 'axios';

export const artconomyTagSearchProvider = (value: string) => {
  return Axios.get('https://artconomy.com/api/profiles/search/tag/?', {
    params: {
      q: value
    }
  })
    .then(({ data }) => data || [])
    .catch(err => {
      console.error(err);
      return [];
    });
};
