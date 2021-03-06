import React from "react";

import { IS_CONSOLE_LOG_OPEN } from "../../../../../../../utils/constants/constants.js";
import { getReviewsRequest } from "../../../../../../../utils/api/requests.js";
import Reviews from "../../../../../../Companies/Reviews/Reviews.jsx";
import ReviewInput from "./ReviewInput/ReviewInput.jsx";
import { axiosCaptcha } from "../../../../../../../utils/api/fetch_api.js";

class PositonReviews extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isEnteringReview: false,
      isAlreadySubmittedReview: false,
      isReviewsDisplaying: false,
      isUpdated: false,
      isReviewChanged: false,
      company: {},
      reviewsList: [],
      review: {
        id: -1
      }
    };

    this.toggleReviewEdit = this.toggleReviewEdit.bind(this);
    this.getPositionsReviews = this.getPositionsReviews.bind(this);
    this.requestUpdate = this.requestUpdate.bind(this);
    this.setReview = this.setReview.bind(this);
  }

  componentDidMount() {
    this.getPositionsReviews();
    if (this.props.card.companyObject.review_id) {
      //await this.props.handleTokenExpiration("cardModal componentDidMount"); //I am not checking if token expired here because getNotes from Notes.jsx is already checking right before this one is executed!!!
      let newReviewsUrl =
        getReviewsRequest.url +
        "?review_id=" +
        this.props.card.companyObject.review_id;
      axiosCaptcha(newReviewsUrl, getReviewsRequest.config).then(response => {
        if (response.statusText === "OK") {
          this.setState({ review: response.data.data });
          IS_CONSOLE_LOG_OPEN &&
            console.log("reviews old review", response.data.data);
        }
      });
    }
  }

  async componentDidUpdate() {
    if (this.state.isReviewChanged === true) {
      IS_CONSOLE_LOG_OPEN && console.log("reviews componentDidUpdate");
      await this.getPositionsReviews();
      this.setState({ isReviewChanged: false });
    }
  }

  requestUpdate() {
    this.setState({ isReviewChanged: true });
  }

  setReview(review) {
    this.setState({ review: review });
  }

  getPositionsReviews() {
    let reviewsUrl =
      getReviewsRequest.url +
      "?company_id=" +
      this.props.card.companyObject.id +
      "&position_id=" +
      this.props.card.position.id +
      "&all_reviews=true";
    axiosCaptcha(reviewsUrl, getReviewsRequest.config).then(response => {
      if (response.statusText === "OK") {
        this.setState({
          reviewsList: response.data.data,
          isReviewsDisplaying: true
        });
        IS_CONSOLE_LOG_OPEN &&
          console.log(
            "position reviews response.data data",
            response.data.data
          );
      }
    });
  }

  toggleReviewEdit() {
    this.setState({
      isReviewsDisplaying: !this.state.isReviewsDisplaying,
      isEnteringReview: !this.state.isEnteringReview
    });
  }

  render() {
    IS_CONSOLE_LOG_OPEN &&
      console.log("reviews render", this.state.reviewsList);
    const { card } = this.props;
    return (
      <div>
        <div className="review-container">
          {!this.state.isEnteringReview && (
            <div className="review-entry-container">
              <div
                className="review-button"
                style={{ margin: "10px 0px 20px 400px", position: "absolute" }}
                onClick={this.toggleReviewEdit}
              >
                {this.props.card.companyObject.review_id
                  ? "Update Your Review"
                  : "Add a Review"}
              </div>
              <div>
                {this.state.reviewsList.length == 0 && (
                  <div className="no-data" style={{ marginTop: 80 }}>
                    No reviews entered for {card.position.job_title} position at{" "}
                    {card.companyObject.company}
                  </div>
                )}
                {this.state.isReviewsDisplaying === true && (
                  <Reviews
                    reviewsList={this.state.reviewsList}
                    positionsList={[]}
                    company_id={this.props.card.companyObject.id}
                    filterDisplay={false}
                    style={{
                      height: "auto",
                      width: "560px",
                      marginLeft: "12px",
                      marginTop: "32px",
                      paddingTop: 0,
                      minHeight: "480px",
                      maxHeight: "480px",
                      display: "block"
                    }}
                    reviewContainerStyle={{
                      display: "block",
                      marginBottom: 20
                    }}
                    leftWidth={{
                      minWidth: "220px",
                      maxWidth: "220px"
                    }}
                  />
                )}
              </div>
            </div>
          )}
          <div className="review-entry-container">
            {this.state.isEnteringReview && (
              <div className="modal-reviews-container">
                <ReviewInput
                  toggleReview={this.toggleReviewEdit}
                  card={this.props.card}
                  setCompany={this.props.setCompany}
                  setReview={this.setReview}
                  renewReviews={this.requestUpdate}
                  oldReview={this.state.review}
                  alert={this.props.alert}
                  handleTokenExpiration={this.props.handleTokenExpiration}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default PositonReviews;
