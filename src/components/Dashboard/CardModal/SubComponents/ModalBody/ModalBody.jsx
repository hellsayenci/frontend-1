import React from "react";

import NavigationPanel from "./NavigationPanel/NavigationPanel.jsx";
import BodyComponents from "./Body/BodyComponents.jsx";

class ModalBody extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      displaying: "Company"
    };

    this.setDisplaying = this.setDisplaying.bind(this);
  }

  setDisplaying(section) {
    this.setState({ displaying: section });
  }

  render() {
    return (
      <div className="modal-body">
        <NavigationPanel
          sections={["Company", "Contacts", "Reviews", "Notes"]}
          setDisplaying={this.setDisplaying}
          displaying={this.state.displaying}
        />
        <BodyComponents
          displaying={this.state.displaying}
          card={this.props.card}
          handleTokenExpiration={this.props.handleTokenExpiration}
          alert={this.props.alert}
          setCompany={this.props.setCompany}
        />
      </div>
    );
  }
}

export default ModalBody;
