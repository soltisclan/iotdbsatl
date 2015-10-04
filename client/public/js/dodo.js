var OfficeList = React.createClass({
  loadOfficeStatus: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        data.sort(function (a, b) {
          return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
        });
        this.setState({data: data});
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
  componentDidMount: function() {
    this.loadOfficeStatus();
    setInterval(this.loadOfficeStatus, this.props.pollInterval);
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
        <StatusBubble name={this.props.data.name} status={this.props.data.status} />
        <div className="office-description">{this.props.data.description}</div>
        <StatusDescription status={this.props.data.status} lastUpdate={this.props.data.lastUpdate}/>
      </div>
    );
  }
});

var StatusBubble = React.createClass({
  render: function() {
    var classes = classNames({
      'status-bubble': true,
      'available': this.props.status == 'available',
      'occupied': this.props.status == 'occupied'
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
    var lastUpdate = new Date(this.props.lastUpdate).toLocaleString();
    switch (this.props.status) {
      case 'available':
        statusText = "Available since " + lastUpdate;
        break;
      case 'occupied':
        statusText = "Occupied since " +  lastUpdate;
        break;
      default:
        statusText = "Status Unavailable";
        break;
    }
    var statusClasses = classNames({
      'office-status': true,
      'available': this.props.status == 'available',
      'occupied': this.props.status == 'occupied'
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

React.render(
  <OfficeList url="/api/status" pollInterval={3000}/>,
  document.getElementById('content')
);
