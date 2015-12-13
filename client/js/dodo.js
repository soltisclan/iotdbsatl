import $ from 'jquery'
import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, Link } from 'react-router'
import ClassNames from 'classnames'
import { Treemap } from 'react-d3';

var Dodo = React.createClass({
  render: function () {
    return (
        <OfficeList url="/api" pollInterval={10000}/>
    );
  }
});

var OfficeList = React.createClass({
  loadOfficeStatus: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        var offices = data.map(function (office) {
          return {
            "name": office.name,
            "description": null,
            "occupied": (office.isOccupied == 0 || office.isOccupied == false) ? false : true,
            "lastUpdate": office.timestamp
          }
        });
        offices.sort(function (a, b) {
          // Sort by ascending order of name and then by descending order of lastUpdate
          // to make sure that the latest status is shown even if the API returns
          // duplicate statuses for an office.
          return a.name > b.name ? 1 : a.name < b.name ? -1 : (a.lastUpdate > b.lastUpdate ? -1 : 1);
        });
        this.setState({data: offices});
        this.setState({hasErrors: false});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        this.setState({errorMessage: "Unable to connect to server"});
        this.setState({hasErrors: true});
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {
      data: [],
      hasErrors: false,
      errorMessage: ''
    };
  },
  componentWillMount: function() {
    this.intervals = [];
  },
  componentDidMount: function() {
    this.loadOfficeStatus();
    this.intervals.push(setInterval(this.loadOfficeStatus, this.props.pollInterval));
  },
  componentWillUnmount: function() {
    this.intervals.forEach(clearInterval);
  },
  render: function() {
    var offices = this.state.data.map(function (office) {
      return (
          <div className="col-xs-6 col-sm-3" key={office.name}>
            <StatusTile data={office}/>
          </div>
      );
    });
    return (
        <div className="officeList">
          { this.state.hasErrors ? <ErrorMessage message={this.state.errorMessage} /> : null }
        <div className="row">
          {offices}
        </div>
        </div>
    );
  }
});

var StatusTile = React.createClass({
  render: function() {
    return (
        <div className="status-tile">
          <StatusBubble name={this.props.data.name} occupied={this.props.data.occupied} />
          <div className="office-description">{this.props.data.description}</div>
          <StatusDescription occupied={this.props.data.occupied} lastUpdate={this.props.data.lastUpdate}/>
        </div>
    );
  }
});

var StatusBubble = React.createClass({
  render: function() {
    var classes = ClassNames({
      'status-bubble': true,
      'available': this.props.occupied == false,
      'occupied': this.props.occupied == true
    });
    return (
        <div className={classes}>
        <div className="office-name">{this.props.name}</div>
    </div>
    );
  }
});

var StatusDescription = React.createClass({
  render: function() {
    var statusText;
    var utcTime = new Date(this.props.lastUpdate);
    var localTime = new Date(utcTime.setMinutes(utcTime.getMinutes() - utcTime.getTimezoneOffset())).toLocaleString();

    switch (this.props.occupied) {
      case false:
        statusText = "Available since " + localTime;
        break;
      case true:
        statusText = "Occupied since " +  localTime;
        break;
      default:
        statusText = "Status Unavailable";
        break;
    }
    var statusClasses = ClassNames({
      'office-status': true,
      'available': this.props.occupied == false,
      'occupied': this.props.occupied == true
    });
    return (
        <div className={statusClasses}>{statusText}</div>
    );
  }
});

var ErrorMessage = React.createClass({
  render: function() {
    return (
        <div className="ErrorMessage alert alert-danger">{this.props.message}</div>
    );
  }
});

var Stats = React.createClass({
  loadOfficeStats: function() {
    $.ajax({
      url: '/api/usage',
      dataType: 'json',
      cache: false,
      success: function(data) {
        var statsArray = [];
        $.each(data, function(key, value) {
          statsArray.push({ label: key, value: value })
        });
        this.setState({'treemapData': statsArray});
        this.setState({hasErrors: false});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error('/api/usage', status, err.toString());
        this.setState({errorMessage: "Unable to connect to server"});
        this.setState({hasErrors: true});
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {
      treemapData: []
    };
  },
  componentDidMount: function() {
    this.loadOfficeStats();
  },
  render: function() {
    return (
    <div>
    { this.state.hasErrors ? <ErrorMessage message={this.state.errorMessage} /> : null }
    <Treemap
    data={this.state.treemapData}
    width={640}
    height={480}
    textColor="#484848"
    fontSize="12px"
    title="Heat Map"
    hoverAnimation={false}/>
        </div>
    )}
});

ReactDOM.render((
    <Router>
    <Route path="/" component={Dodo} />
    <Route path="stats" component={Stats} />
    </Router>
), document.getElementById('content'));
