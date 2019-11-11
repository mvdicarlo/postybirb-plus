import React from 'react';
import { headerStore } from '../../stores/header.store';

const Home: React.FC = props => {
  headerStore.updateHeaderState({
    title: 'Home',
    routes: []
  });
  return <h1>Hello!</h1>;
};

export default Home;
