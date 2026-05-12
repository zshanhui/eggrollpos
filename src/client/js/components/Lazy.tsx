import React, {Component} from 'react';
import {SpinnerPage} from './Spinner';

export default class Lazy extends Component {
  constructor(props) {
    super(props);
    this.state = {module: null, error: null};
  }

  static getDerivedStateFromError(error) {
    return {error};
  }

  componentDidMount() {
    this.loadModule();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.module !== this.props.module) {
      this.setState({module: null, error: null});
      this.loadModule();
    }
  }

  async loadModule() {
    try {
      let module = await this.props.module;
      module = module.default ? module.default : module;
      this.setState({module});
    } catch (err) {
      this.setState({error: err.message || 'Failed to load'});
    }
  }

  render() {
    const {module: Module, error} = this.state;
    if (error) {
      return <div style={{padding: '2rem', textAlign: 'center', color: '#999'}}>Page load failed: {error}</div>;
    }
    return Module ? <Module {...this.props} /> : <SpinnerPage />;
  }
}
