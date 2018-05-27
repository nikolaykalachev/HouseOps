// @flow
import React, { Component } from 'react';

import {
  Dialog,
  Button,
  InputGroup,
  Intent
} from '@blueprintjs/core';

import axios from 'axios';

import { toaster } from '../utils/toaster';

const { getGlobal } = require('electron').remote;

const reload = getGlobal('reload');

type Props = {};

export default class Configurations extends Component {
  props: Props;

  constructor() {
    super();

    this.state = {
      visibility: false,
      database_host: localStorage.getItem('database_host'),
      database_user: localStorage.getItem('database_user'),
      database_pass: localStorage.getItem('database_pass')
    };
  }

  async checkDatabase() {
    if (this.state.database_pass && this.state.database_user) {
      return axios.post(`${this.state.database_host}/?user=${this.state.database_user}&password=${this.state.database_pass}`, 'show databases FORMAT JSON;');
    }

    return axios.post(this.state.database_host, 'show databases FORMAT JSON;');
  }

  handleOpen = () => { this.setState({ visibility: true }); };

  handleOk = () => {
    this.checkDatabase()
      .then((res) => {
        console.log(res);

        if (!this.state.database_host || !res.data.data) {
          toaster.show({
            message: 'The host is empty.',
            intent: Intent.WARNING,
            icon: 'error'
          });
          return;
        }

        localStorage.setItem('database_host', this.state.database_host ? this.state.database_host : '');
        localStorage.setItem('database_user', this.state.database_user ? this.state.database_user : '');
        localStorage.setItem('database_pass', this.state.database_pass ? this.state.database_pass : '');

        this.setState({
          visibility: false
        });

        toaster.show({
          message: 'Connected, reloading...',
          intent: Intent.SUCCESS,
          icon: 'tick-circle'
        });

        setTimeout(() => reload(), 2000); // eslint-disable-line

        return null;
      })
      .catch((e) => {
        console.error(e);

        let errorMessage = '';

        switch (e.message) {
          case 'Request failed with status code 401':
            errorMessage = 'Unauthorized, username or password is incorrect.';
            break;
          case 'Cannot read property \'protocol\' of null':
            errorMessage = 'Unable to connect, your host is incorrect.';
            break;
          case 'Network Error':
            errorMessage = 'Network error, your host is not accessible.';
            break;
          default:
            errorMessage = `Unknown error: ${e.message}`;
        }

        toaster.show({
          message: errorMessage,
          intent: Intent.DANGER,
          icon: 'error',
          timeout: 0
        });
      });
  };

  handleChangeHost = (e) => this.setState({ database_host: e.target.value });
  handleChangePass = (e) => this.setState({ database_pass: e.target.value });
  handleChangeUser = (e) => this.setState({ database_user: e.target.value });

  handleCancel = () => { this.setState({ visibility: false }); };

  render() {
    return (

      <Dialog
        icon="cog"
        isOpen={this.state.visibility}
        onClose={this.handleCancel}
        title="Database configuration"
      >
        <div className="pt-dialog-body">


          <InputGroup leftIcon="globe" large="true" className="pt-input-group .modifier pt-fill" type="text" placeholder="http://localhost:8123" value={this.state.database_host} onChange={this.handleChangeHost} />
          <br />
          <InputGroup leftIcon="user" large="true" className="pt-input-group .modifier pt-fill" type="text" placeholder="default" value={this.state.database_user} onChange={this.handleChangeUser} />
          <br />
          <InputGroup leftIcon="lock" large="true" className="pt-input-group .modifier pt-fill" type="password" placeholder="password" value={this.state.database_pass} onChange={this.handleChangePass} />

        </div>
        <div className="pt-dialog-footer">
          <div className="pt-dialog-footer-actions">
            <Button
              intent={Intent.SUCCESS}
              onClick={this.handleOk}
              text="Save and connect"
            />
          </div>
        </div>
      </Dialog>
    );
  }
}