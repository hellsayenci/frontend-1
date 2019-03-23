import React, {Component} from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import Column from '../Column/Column.jsx';
import {fetchApi} from '../../utils/api/fetch_api'
import {
  addJobAppsRequest,
  authenticateRequest,
  getJobAppsRequest,
  syncUserEmailsRequest,
  updateJobStatusRequest
} from '../../utils/api/requests.js'
import {IS_MOCKING} from '../../config/config.js';
import {mockJobApps} from '../../utils/api/mockResponses.js';
import {UPDATE_APPLICATION_STATUS} from '../../utils/constants/constants.js';
import {generateCurrentDate} from '../../utils/helpers/helperFunctions.js';

import './style.scss'

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      toapply: [],
      applied: [],
      phonescreen: [],
      onsiteinterview: [],
      offer: [],
      jobsRejectedApplied: [],
      jobsRejectedPhoneScreen: [],
      jobsRejectedOnsiteInterview: [],
      jobsRejectedOffer: []
    };

    this.toapply = [];
    this.applied = [];
    this.phonescreen = [];
    this.onsiteinterview = [];
    this.offer = [];
    this.jobsRejectedApplied = [];
    this.jobsRejectedPhoneScreen = [];
    this.jobsRejectedOnsiteInterview = [];
    this.jobsRejectedOffer = [];

    this.updateApplications = this.updateApplications.bind(this);
    this.addNewApplication = this.addNewApplication.bind(this);
  }

  componentDidMount() {
    if (IS_MOCKING) {
      this.sortJobApplications(mockJobApps.data);
      return;
    }
    const {url, config} = authenticateRequest;
    config.body.token = this.props.googleAuth.currentUser
      .get()
      .getAuthResponse().access_token;
    config.body = JSON.stringify(config.body);
    fetchApi(url, config)
      .then(response => {
        if (response.ok) {
          return response.json;
        }
      })
      .then(response => {
        const {url, config} = syncUserEmailsRequest;
        this.token = `${response.data.token_type} ${response.data.access_token.trim()}`;
        config.headers.Authorization = this.token;
        fetchApi(url, config)
          .then(response => {
            return {
              ok: response.ok,
            }
          })
          .then(({ok}) => {
            const {url, config} = getJobAppsRequest;
            config.headers.Authorization = this.token;
            fetchApi(url, config)
              .then(response => {
                if (response.ok) {
                  this.sortJobApplications(response.json.data);
                }
              });
          });
      });
  }

  sortJobApplications(applications) {
    for (let application of applications) {
      switch (application.applicationStatus.value.toLowerCase()) {
        case 'to apply':
          this.toapply.push(application);
          break;
        case 'applied':
          if (application.isRejected) {
            this.jobsRejectedApplied.push(application);
          } else {
            this.applied.push(application);
          }
          break;
        case 'phone screen':
          if (application.isRejected) {
            this.jobsRejectedPhoneScreen.push(application);
          } else {
            this.phonescreen.push(application);
          }
          break;
        case 'onsite interview':
          if (application.isRejected) {
            this.jobsRejectedOnsiteInterview.push(application);
          } else {
            this.onsiteinterview.push(application);
          }
          break;
        case 'offer':
          if (application.isRejected) {
            this.jobsRejectedOffer.push(application);
          } else {
            this.offer.push(application);
          }
          break;
        default:
      }
    }
    this.refreshJobs();
  }

  refreshJobs() {
    this.setState({
      toapply: this.toapply,
      applied: this.applied,
      phonescreen: this.phonescreen,
      onsiteinterview: this.onsiteinterview,
      offer: this.offer,
      jobsRejectedApplied: this.jobsRejectedApplied,
      jobsRejectedOffer: this.jobsRejectedOffer,
      jobsRejectedOnsiteInterview: this.jobsRejectedOnsiteInterview,
      jobsRejectedPhoneScreen: this.jobsRejectedPhoneScreen
    });
  }

  updateApplications(card, dragColumnName, dropColumnName) {
    if (dragColumnName === dropColumnName) {
      return;
    }
    const removedItemColumn = this.state[dragColumnName]
      .filter(job => {
        return job.id !== card.id;
      });

    card.applicationStatus = UPDATE_APPLICATION_STATUS[dropColumnName];
    let insertedItemColumn = this.state[dropColumnName].slice();
    insertedItemColumn.unshift(card);

    let {url, config} = updateJobStatusRequest;
    config.body = JSON.stringify({
      jobapp_id: card.id,
      status_id: card.applicationStatus.id,
      rejected: false
    });
    config.headers.Authorization = this.token;

    fetchApi(url, config)
      .then(response => {
        if (response.ok) {
          this.setState(() => ({
            [dragColumnName]: removedItemColumn,
            [dropColumnName]: insertedItemColumn
          }));
        }
      });
  }

  addNewApplication({name, title, columnName}) {
    const {url, config} = addJobAppsRequest;
    config.headers.Authorization = this.token;
    config.body = JSON.stringify({
      job_title: title,
      status_id: UPDATE_APPLICATION_STATUS[columnName].id,
      company: name,
      application_date: generateCurrentDate(),
      source: ''
    });

    fetchApi(url, config)
      .then(response => {
        if (response.ok) {
          let insertedItemColumn = this.state[columnName].slice();
          insertedItemColumn.unshift(response.json.data);

          this.setState(() => ({
            [columnName]: insertedItemColumn
          }));
        }
      });
  }

  render() {
    return (
      <div className="dashboard-container">
        <Column
          name="toapply"
          updateApplications={this.updateApplications}
          addNewApplication={this.addNewApplication}
          icon="../../src/assets/icons/ToApplyIcon@3x.png"
          title="TO APPLY"
          totalCount={this.state.toapply.length}
          cards={this.state.toapply}
        />
        <Column
          name="applied"
          updateApplications={this.updateApplications}
          addNewApplication={this.addNewApplication}
          icon="../../src/assets/icons/AppliedIcon@3x.png"
          title="APPLIED"
          totalCount={
            this.state.applied.length +
            this.state.jobsRejectedApplied.length
          }
          cards={this.state.applied}
          cardsRejecteds={this.state.jobsRejectedApplied}
          message="rejected without any interview"
        />
        <Column
          name="phonescreen"
          updateApplications={this.updateApplications}
          addNewApplication={this.addNewApplication}
          icon="../../src/assets/icons/PhoneScreenIcon@3x.png"
          title="PHONE SCREEN"
          totalCount={
            this.state.phonescreen.length +
            this.state.jobsRejectedPhoneScreen.length
          }
          cards={this.state.phonescreen}
          cardsRejecteds={this.state.jobsRejectedPhoneScreen}
          message="rejected after phone screens"
        />
        <Column
          name="onsiteinterview"
          updateApplications={this.updateApplications}
          addNewApplication={this.addNewApplication}
          icon="../../src/assets/icons/OnsiteInterviewIcon@3x.png"
          title="ONSITE INTERVIEW"
          totalCount={
            this.state.onsiteinterview.length +
            this.state.jobsRejectedOnsiteInterview.length
          }
          cards={this.state.onsiteinterview}
          cardsRejecteds={this.state.jobsRejectedOnsiteInterview}
          message="rejected after interviews"
        />
        <Column
          name="offer"
          updateApplications={this.updateApplications}
          addNewApplication={this.addNewApplication}
          icon="../../src/assets/icons/OffersIcon@3x.png"
          title="OFFERS"
          totalCount={
            this.state.offer.length + this.state.jobsRejectedOffer.length
          }
          cards={this.state.offer}
          cardsRejecteds={this.state.jobsRejectedOffer}
          message="you rejected their offer"
        />
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(Dashboard);
