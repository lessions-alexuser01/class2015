var React = require('react');
var omdb = require('omdb-client');
// var omdb = require('./fake-omdb-client');
var preload = require('./netflix');
var _ = require('lodash');
var MovieContainer = require('./MovieContainer');
var MovieTileLayout = require('./MovieTileLayout');
var MovieListLayout = require('./MovieListLayout');
var Header = require('./Header');


class App extends React.Component {
	constructor(props) {
		super(props);


		this.state = {
			layout: 'tile',
			results: _.clone(preload.Search),
			term: ''
		};
	}

	changeLayout(name) {
		this.setState({layout:name});
	}

	search(term) {
		this.setState({term});
		omdb.search({query:term}, (err,data) => {
			this.setState({results: data.Search});
		});
	}

	clearTerm() {
		this.setState({term:'', results: _.clone(preload.Search)});
	}

	render() {
		var layout;
		if (this.state.layout === 'tile') {
			layout = MovieTileLayout
		} else {
			layout = MovieListLayout
		}

		return (
			<div className="app-container">
				<Header
					layout={this.state.layout}
					changeLayout={this.changeLayout.bind(this)}
					search={this.search.bind(this)}
					clearTerm={this.clearTerm.bind(this)}
					term={this.state.term}
				/>
				<div className="movies-list">
				{this.state.results.map( el => {
					return (
						<MovieContainer
							id={el.imdbID}
							key={el.imdbID}
							layout={layout}
						/>
					);
				})}
				</div>
			</div>
		);
	}
}

module.exports = App;