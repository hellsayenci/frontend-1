import React, { Component } from "react";
import { DragDropContext } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";

import Column from "./Column/Column.jsx";
import Spinner from "../Partials/Spinner/Spinner.jsx";
import { axiosCaptcha } from "../../utils/api/fetch_api";
import {
  addJobAppsRequest,
  getJobAppsRequest,
  updateJobStatusRequest,
  postUsersRequest
} from "../../utils/api/requests.js";
import { IS_MOCKING } from "../../config/config.js";
import { mockJobApps } from "../../utils/api/mockResponses.js";
import {
  UPDATE_APPLICATION_STATUS,
  IS_CONSOLE_LOG_OPEN
} from "../../utils/constants/constants.js";
import { generateCurrentDate } from "../../utils/helpers/helperFunctions.js";

import "./style.scss";

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      toApply: [],
      applied: [],
      phoneScreen: [],
      onsiteInterview: [],
      offer: [],
      appliedRejected: [],
      phoneScreenRejected: [],
      onsiteInterviewRejected: [],
      offerRejected: [],
      isInitialRequest: "beforeRequest"
    };

    this.toApply = [];
    this.applied = [];
    this.phoneScreen = [];
    this.onsiteInterview = [];
    this.offer = [];
    this.appliedRejected = [];
    this.phoneScreenRejected = [];
    this.onsiteInterviewRejected = [];
    this.offerRejected = [];

    this.updateApplications = this.updateApplications.bind(this);
    this.addNewApplication = this.addNewApplication.bind(this);
    this.deleteJobFromList = this.deleteJobFromList.bind(this);
    this.moveToRejected = this.moveToRejected.bind(this);
  }

  async componentDidMount() {
    if (this.props.cookie("get", "jobhax_access_token") != ("" || null)) {
      await this.getData();
      axiosCaptcha(
        postUsersRequest.url("verify_recaptcha"),
        postUsersRequest.config,
        "dashboard"
      ).then(response => {
        if (response.statusText === "OK") {
          if (response.data.success != true) {
            this.setState({ isUpdating: false });
            IS_CONSOLE_LOG_OPEN && console.log(response.data.error_message);
            this.props.alert(
              5000,
              "error",
              "Error: " + response.data.error_message
            );
          }
        }
      });
    }
  }

  componentDidUpdate() {
    this.getData();
  }

  async getData() {
    if (IS_MOCKING) {
      this.sortJobApplications(mockJobApps.data);
      return;
    }
    if (
      this.props.cookie("get", "jobhax_access_token") != ("" || null) &&
      this.state.isInitialRequest === "beforeRequest"
    ) {
      this.setState({ isInitialRequest: true });
      IS_CONSOLE_LOG_OPEN &&
        console.log(
          "dashboard token",
          this.props.cookie("get", "jobhax_access_token")
        ),
        "\ndashboard active?",
        this.props.active;
      if (this.props.active) {
        await this.props.handleTokenExpiration("dashboard getData");
        const { url, config } = getJobAppsRequest;
        axiosCaptcha(url, config).then(response => {
          if (response.statusText === "OK") {
            this.sortJobApplications(response.data.data);
            this.setState({ isInitialRequest: false });
            IS_CONSOLE_LOG_OPEN &&
              console.log("dashboard response.data data", response.data.data);
          }
        });
      }
    }
  }

  sortJobApplications(applications) {
    for (let application of applications) {
      switch (application.applicationStatus.value.toLowerCase()) {
        case "to apply":
          this.toApply.push(application);
          break;
        case "applied":
          if (application.isRejected) {
            this.appliedRejected.push(application);
          } else {
            this.applied.push(application);
          }
          break;
        case "phone screen":
          if (application.isRejected) {
            this.phoneScreenRejected.push(application);
          } else {
            this.phoneScreen.push(application);
          }
          break;
        case "onsite interview":
          if (application.isRejected) {
            this.onsiteInterviewRejected.push(application);
          } else {
            this.onsiteInterview.push(application);
          }
          break;
        case "offer":
          if (application.isRejected) {
            this.offerRejected.push(application);
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
      toApply: this.toApply,
      applied: this.applied,
      phoneScreen: this.phoneScreen,
      onsiteInterview: this.onsiteInterview,
      offer: this.offer,
      appliedRejected: this.appliedRejected,
      offerRejected: this.offerRejected,
      onsiteInterviewRejected: this.onsiteInterviewRejected,
      phoneScreenRejected: this.phoneScreenRejected
    });
  }

  async updateApplications(card, dragColumnName, dropColumnName) {
    if (dragColumnName === dropColumnName) {
      return;
    }
    const removedItemColumn = this.state[dragColumnName].filter(job => {
      return job.id !== card.id;
    });

    card.applicationStatus = UPDATE_APPLICATION_STATUS[dropColumnName];
    let insertedItemColumn = this.state[dropColumnName].slice();
    insertedItemColumn.unshift(card);
    await this.props.handleTokenExpiration("dashboard updateApplications");
    console.log("ok? after");
    let { url, config } = updateJobStatusRequest;
    config.body = {
      jobapp_id: card.id,
      status_id: card.applicationStatus.id,
      rejected: false
    };
    axiosCaptcha(url, config).then(response => {
      if (response.statusText === "OK") {
        this.setState(() => ({
          [dragColumnName]: removedItemColumn,
          [dropColumnName]: insertedItemColumn
        }));
      }
    });
  }

  async addNewApplication({ name, title, columnName }) {
    await this.props.handleTokenExpiration("dashboard addNewApplication");
    const { url, config } = addJobAppsRequest;
    config.body = {
      job_title: title,
      status_id: UPDATE_APPLICATION_STATUS[columnName].id,
      company: name,
      application_date: generateCurrentDate(),
      source: "N/A"
    };

    axiosCaptcha(url, config, "add_job").then(response => {
      if (response.statusText === "OK") {
        let insertedItemColumn = this.state[columnName].slice();
        insertedItemColumn.unshift(response.data.data);
        this.setState(() => ({
          [columnName]: insertedItemColumn
        }));
      }
    });
  }

  moveToRejected(columnName, card, isRejected) {
    if (isRejected) {
      var listToAdd = columnName + "Rejected";
      var listToRemove = columnName;
    } else {
      var listToAdd = columnName;
      var listToRemove = columnName + "Rejected";
    }
    card.isRejected = !card.isRejected;
    const removedItemColumn = this.state[listToRemove].filter(job => {
      return job.id !== card.id;
    });
    let insertedItemColumn = this.state[listToAdd].slice();
    insertedItemColumn.unshift(card);
    this.setState(() => ({
      [listToRemove]: removedItemColumn,
      [listToAdd]: insertedItemColumn
    }));
  }

  deleteJobFromList(columnName, cardId, isRejected) {
    if (isRejected) {
      columnName = columnName + "Rejected";
    }
    const removedItemColumn = this.state[columnName].filter(job => {
      return job.id !== cardId;
    });
    this.setState(() => ({
      [columnName]: removedItemColumn
    }));
  }

  render() {
    IS_CONSOLE_LOG_OPEN && console.log("Dashboard opened!");
    if (this.state.isInitialRequest === "beforeRequest")
      return <Spinner message="Reaching your account..." />;
    if (this.state.isInitialRequest && !IS_MOCKING)
      return <Spinner message="Preparing your dashboard..." />;
    return (
      <div>
        <div className="dashboard-container">
          <Column
            name="toApply"
            id="2"
            updateApplications={this.updateApplications}
            addNewApplication={this.addNewApplication}
            deleteJobFromList={this.deleteJobFromList}
            icon="../../src/assets/icons/ToApplyIcon@3x.png"
            title="TO APPLY"
            totalCount={this.state.toApply.length}
            cards={this.state.toApply}
            handleTokenExpiration={this.props.handleTokenExpiration}
            alert={this.props.alert}
          />
          <div className="column-divider" />
          <Column
            name="applied"
            id="1"
            updateApplications={this.updateApplications}
            addNewApplication={this.addNewApplication}
            deleteJobFromList={this.deleteJobFromList}
            moveToRejected={this.moveToRejected}
            icon="../../src/assets/icons/AppliedIcon@3x.png"
            title="APPLIED"
            totalCount={
              this.state.applied.length + this.state.appliedRejected.length
            }
            cards={this.state.applied}
            cardsRejecteds={this.state.appliedRejected}
            message="rejected without any interview"
            handleTokenExpiration={this.props.handleTokenExpiration}
            alert={this.props.alert}
          />
          <div className="column-divider" />
          <Column
            name="phoneScreen"
            id="3"
            updateApplications={this.updateApplications}
            addNewApplication={this.addNewApplication}
            deleteJobFromList={this.deleteJobFromList}
            moveToRejected={this.moveToRejected}
            icon="../../src/assets/icons/PhoneScreenIcon@3x.png"
            title="PHONE SCREEN"
            totalCount={
              this.state.phoneScreen.length +
              this.state.phoneScreenRejected.length
            }
            cards={this.state.phoneScreen}
            cardsRejecteds={this.state.phoneScreenRejected}
            message="rejected after phone screens"
            handleTokenExpiration={this.props.handleTokenExpiration}
            alert={this.props.alert}
          />
          <div className="column-divider" />
          <Column
            name="onsiteInterview"
            id="4"
            updateApplications={this.updateApplications}
            addNewApplication={this.addNewApplication}
            deleteJobFromList={this.deleteJobFromList}
            moveToRejected={this.moveToRejected}
            icon="../../src/assets/icons/OnsiteInterviewIcon@3x.png"
            title="ONSITE INTERVIEW"
            totalCount={
              this.state.onsiteInterview.length +
              this.state.onsiteInterviewRejected.length
            }
            cards={this.state.onsiteInterview}
            cardsRejecteds={this.state.onsiteInterviewRejected}
            message="rejected after interviews"
            handleTokenExpiration={this.props.handleTokenExpiration}
            alert={this.props.alert}
          />
          <div className="column-divider" />
          <Column
            name="offer"
            id="5"
            updateApplications={this.updateApplications}
            addNewApplication={this.addNewApplication}
            deleteJobFromList={this.deleteJobFromList}
            moveToRejected={this.moveToRejected}
            icon="../../src/assets/icons/OffersIcon@3x.png"
            title="OFFERS"
            totalCount={
              this.state.offer.length + this.state.offerRejected.length
            }
            cards={this.state.offer}
            cardsRejecteds={this.state.offerRejected}
            message="you rejected their offer"
            handleTokenExpiration={this.props.handleTokenExpiration}
            isLastColumn={true}
            alert={this.props.alert}
          />
        </div>
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(Dashboard);
