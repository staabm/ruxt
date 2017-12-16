import React from "react";
import Select, { Async } from "react-select";
import Slider from "react-rangeslider";
import debounce from "es6-promise-debounce";
import { PulseLoader } from "react-spinners";
import Visual from "../components/visual";
import Human from "../components/human";

const humanCount = 1000;

class ResultComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      url: { origin: "Enter website URL" },
      device: { label: "All device types", value: "all" },
      connection: { label: "All connection types", value: "all" },
      time: "1",
      fcp: null,
      onload: null,
      fcpHumanCount: 0,
      loadingHumanCount: humanCount,
      onloadHumanCount: 0,
      loading: false,
    };

    this.handleOnURLChange = this.handleOnURLChange.bind(this);
    this.handleOnDeviceChange = this.handleOnDeviceChange.bind(this);
    this.handleOnConnectionChange = this.handleOnConnectionChange.bind(this);
    this.handleGetOrigins = this.handleGetOrigins.bind(this);
    this.handleOnTimeChange = this.handleOnTimeChange.bind(this);
    this.handleUpdateNumbers = this.handleUpdateNumbers.bind(this);
    this.handleUpdateHumanCount = this.handleUpdateHumanCount.bind(this);
  }

  handleOnURLChange(selectedOption) {
    this.setState({
      url: selectedOption,
    });
    if (selectedOption) {  
      this.handleUpdateNumbers(
        selectedOption.origin,
        this.state.device.value,
        this.state.connection.value,
      );
    }
  }

  handleOnDeviceChange(selectedOption) {
    this.setState({
      device: selectedOption,
    });
    if ((this.state.url.origin) || (!(this.state.url.origin = "Enter website URL"))) {
      this.handleUpdateNumbers(
        this.state.url.origin,
        selectedOption.value,
        this.state.connection.value,
      );
    }
  }

  handleOnConnectionChange(selectedOption) {
    this.setState({
      connection: selectedOption,
    });
    if ((this.state.url.origin) || (!(this.state.url.origin = "Enter website URL"))) {
      this.handleUpdateNumbers(
        this.state.url.origin,
        this.state.device.value,
        selectedOption.value,
      );
    }
  }

  handleOnTimeChange(selectedOption) {
    this.setState({
      time: selectedOption,
    });
    this.handleUpdateHumanCount(this.state.fcp, this.state.onload, selectedOption);
  }

  handleGetOrigins(input) {
    if (!input) {
      return Promise.resolve({ options: [] });
    }
    return fetch(`${process.env.BACKEND_URL}/search`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin: input,
      }),
    })
      .then(response => response.json())
      .then((json) => {
        return { options: json };
      });
  }

  async handleUpdateNumbers(url, device, connection) {
    this.setState({
      loading: true,
    });
    const response = await fetch(`${process.env.BACKEND_URL}/content`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin: url,
        device,
        connection,
      }),
    });
    const responseJSON = await response.json();
    this.setState({
      fcp: responseJSON.bam.fcp,
      onload: responseJSON.bam.onload,
      loading: false,
    });
    this.handleUpdateHumanCount(responseJSON.bam.fcp, responseJSON.bam.onload, this.state.time);
  }

  handleUpdateHumanCount(fcp, onload, time) {
    if (time=="0") {
      this.setState({
        onloadHumanCount: 0,
        fcpHumanCount: 0,
        loadingHumanCount: humanCount,
      });
      return;
    }
    const fcp_prob = fcp[time];
    const onload_prob = onload[time];
    const onloadHumanCount = Math.max(0, Math.floor(onload_prob*humanCount));
    const fcpHumanCount = Math.max(0, Math.floor((fcp_prob-onload_prob)*humanCount));
    const loadingHumanCount = Math.max(0, Math.floor(humanCount - fcp_prob*humanCount));
    this.setState({
      onloadHumanCount,
      fcpHumanCount,
      loadingHumanCount,
    });
  }

  render() {
    const deviceList = [
      { value: "all", label: "All device types" },
      { value: "phone", label: "Phone" },
      { value: "tablet", label: "Tablet" },
      { value: "desktop", label: "Desktop" },
    ];
    const connectionList = [
      { value: "all", label: "All connection types" },
      { value: "4G", label: "4G" },
      { value: "3G", label: "3G" },
      { value: "2G", label: "2G" },
      { value: "slow-2G", label: "slow-2G" },
      { value: "offline", label: "offline" },
    ];
    const formatsecond = value => value + " s";
    return (
      <div className="container">
        <div className="loader">
          <PulseLoader
              color={'#db3340'}
              loading={this.state.loading}
              size={30} />
        </div>
        <div className="URLInput__wrapper">
          <Async
            placeholder="Enter website URL"
            value={this.state.url}
            onChange={debounce(this.handleOnURLChange, 500)}
            valueKey="origin"
            labelKey="origin"
            clearable={false}
            backspaceRemoves={true}
            loadOptions={debounce(this.handleGetOrigins, 500)}
          />
        </div>
        <div className="DeviceConnection__wrapper">
          <div className="DeviceInput__wrapper">
            <Select
              value={this.state.device.value}
              onChange={debounce(this.handleOnDeviceChange, 500)}
              clearable={false}
              options={deviceList}
              searchable={false}
            />
          </div>
          <div className="ConnectionInput__wrapper">
            <Select
              value={this.state.connection.value}
              onChange={debounce(this.handleOnConnectionChange, 500)}
              clearable={false}
              searchable={false}
              options={connectionList}
            />
          </div>
        </div>
        <div className="TimeInput__wrapper">
          <Slider
            min={0}
            max={10}
            value={Number(this.state.time)}
            format={formatsecond}
            handleLabel={this.state.time}
            onChange={this.handleOnTimeChange}
          />
        </div>
        <div className="visual__wrapper">
          <Visual
            fcpHumanCount={this.state.fcpHumanCount}
            onloadHumanCount={this.state.onloadHumanCount}
            loadingHumanCount={this.state.loadingHumanCount}
          />
        </div>
        <div className="table__wrapper">
          <div className="seb__wrapper">
            <span className="table__header">
            SEB score
            </span>
            <span className="table__content">
              {((this.state.fcp === null) || (this.state.time == "0") || this.state.fcp[this.state.time] === null) ? "-"
                  : this.state.fcp["1"].toFixed(3)}
            </span>
          </div>
          <div className="fcpProb__wrapper">
            <span className="table__header">
              FCP Probability
            </span>
            <span className="table__content">
              {((this.state.fcp === null) || (this.state.time == "0") || this.state.fcp[this.state.time] === null) ? "-"
                  : this.state.fcp[this.state.time].toFixed(3)}
            </span>
          </div>
          <div className="onloadProb__wrapper">
            <span className="table__header">
              Onload Probability
            </span>
            <span className="table__content">
              {((this.state.onload === null) || (this.state.time == "0") || this.state.fcp[this.state.time] === null) ? "-"
                  : this.state.onload[this.state.time].toFixed(3)}
            </span>
          </div>
        </div>
        <div className="explanation__wrapper">
          <div className="explanation__header">
            <span className="explanation__text">
              How to use the tool
            </span>
          </div>
          <div className="explanation__content">
            <div className="explanation__section">
              <span className="explanation__text">
               Select a website using the autocomplete.
               Optionally, select a device and connection type.
               Try the time slider to select a time (in seconds).
              </span>
            </div>
            <div className="explanation__section">
              <span className="explanation__text">
                Imagine 1000 people visit the website. Each visitor is represented as a figure <Human color="#5486AA" />.
              </span>
            </div>
            <div className="explanation__section">
              <span className="explanation__text">
                When the user opens the website,
                (1) either nothing is loaded yet (represented as the figure <Human color="#ffffff" />),
                or (2) some content on the screen (represented as the figure <Human color="#5486AA" />),
                or (3) document loaded (represented as the figure <Human color="#153B58" />).
              </span>
            </div>
          </div>
        </div>
        <style jsx>{`
          .URLInput__wrapper, .DeviceInput__wrapper,
          .ConnectionInput__wrapper, .TimeInput__wrapper,
          .visual__wrapper, .time__wrapper, .explanation__wrapper {
              margin: 1em .5em;
          }
          .table__wrapper {                        
              display: flex;
              justify-content: space-around;
              align-items: flex-start;
          }
          .seb__wrapper, .fcpProb__wrapper, .onloadProb__wrapper {               
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              padding: 1em .3em;
          }
          .table__header {
              color: #153B58;
              font-size: 1.2em;
          }
          .table__content {
              font-size: 3em;
              color: #db3340;
          }
          .explanation__header {
              color: #153B58;
              font-size: 1.2em;
              padding-bottom: 1em;
          }
          @media all and (max-width: 40em) {
              .table__wrapper {
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
              }
          }
          @media all and (min-width: 50em) {
              .DeviceConnection__wrapper {
                  display: flex;
              }
              .DeviceInput__wrapper, .ConnectionInput__wrapper {
                  width: 50%;
              }
          }
          .loader {                        
              position: absolute;
              top: 0;
              bottom: 0;
              left: 0;
              right: 0;
              display: flex;
              justify-content: center;
              align-items: center;
          }
          .explanation__section {
            padding: .3em 0;
          }
        `}
        </style>
      </div>
    );
  }
}

export default ResultComponent;
