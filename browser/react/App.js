import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Nav from './Nav';
import Transactions from './Transactions';
import SingleStock from './SingleStock';
import initialState from './initialState';
import SuggestedStocks from './SuggestedStocks';
import Portfolio from './Portfolio';

const socket = io(window.location.origin);
let clientIP = '';

socket.on('connect', () => {
  socket.emit('joinRoom', window.location.origin);
});


class App extends Component {
  constructor(props) {
    super(props);

    this.state = initialState;

    this.reset = this.reset.bind(this);
    this.searchActive = this.searchActive.bind(this);
    this.filterActive = this.filterActive.bind(this);
    this.onMessageSubmit = this.onMessageSubmit.bind(this);
    this.selectAllocationPercent = this.selectAllocationPercent.bind(this);
  }

  componentWillMount() {
    socket.on('message', (msgs) => {
      this.setState({ msgs });
    });

    socket.on('ip', (clientAddress) => {
      clientIP = clientAddress;
    });

    socket.on('messageHistory', (messages) => {
      messages.forEach((msgs) => {
        this.setState({ msgs });
      });
    });
    socket.on('sendData', () => {
      if (Object.keys(this.props).length < 2) {
        this.setState({ quote: [] });
      }
    });
  }

  componentDidMount() {
    axios.get('/api/transactions')
      .then(response => response.data)
      .then(transactions => this.setState({ transactions }))
      .catch(err => console.log(err));
  }

  onMessageSubmit(msgs) {
    let tempArr = [];
    msgs = `${clientIP}: ${msgs}`;
    if (this.state.msgs.length === 0) {
      tempArr.push(msgs);
    } else {
      tempArr = this.state.msgs;
      tempArr.push(msgs);
    }
    msgs = tempArr;
    this.setState({ msgs });

    socket.emit('message', msgs);
  }

  reset() {
    axios.get('/api/stocks/nasdaq')
      .then(response => response.data)
      .then((nasdaq) => {
        this.setState({ nasdaq });
        this.setState({ search: false });
      })
      .catch(err => console.log(err));
  }

  filterActive(filter) {
    let url = '/api/stocks/nasdaq/filter';
    if (filter.date.length === 0) {
      url = '/api/stocks/nasdaq';
    }
    axios.get(url, { params: filter })
      .then(res => res.data)
      .then(nasdaq => this.setState({ nasdaq }))
      .catch(err => console.log(err));
  }

  searchActive(input) {
    const searchedStock = { searchedStock: input };
    axios.get('/api/stocks/nasdaq/search', { params: searchedStock })
      .then(res => res.data)
      .then((nasdaq) => {
        this.setState({ nasdaq });
        this.setState({ search: true });
      })
      .catch(err => console.log(err));
  }

  selectAllocationPercent(ev) {
    const selectedAllocation = ev.target.value;
    this.setState({ selectedAllocation });
  }

  render() {
    // console.log('.....in App.js, state, props',this.state, this.props)
    const transactions = [...this.state.transactions, ...this.state.services];
    return (
      <div className="container-fluid">
        <Nav />
        <div style={{ marginTop: '65px' }}>
          <div className="row">

            <div className="col-sm-4">
              { Object.keys(this.props).length > 1 ?
                <Transactions searchFlag={this.state.search} reset={this.reset} transactions={transactions} services={this.state.services} />
                : <SingleStock router={this.props.router} /> }
            </div>

            <div className="col-sm-4">
              <SuggestedStocks companies={this.state.companies} allocationPercents={this.state.allocationPercents} />
            </div>

            <div className="col-sm-4">
              <Portfolio />
            </div>

          </div>
        </div>
      </div>
    );
  }
}


export default App;
