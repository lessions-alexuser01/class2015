import 'fetch';
import React from 'react';

import {reposForUser} from './api';
import RepositoryList from './repository-list';

class Helloworld extends React.Component {
  render() {
 
    return (
      <div>
        <h2>Mumbo</h2>
        <RepositoryList />
      </div>
    )
  }
}

React.render(<Helloworld name="Hello world" />, document.getElementById('app'));

